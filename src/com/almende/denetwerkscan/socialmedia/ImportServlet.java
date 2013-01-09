package com.almende.denetwerkscan.socialmedia;

import java.io.IOException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.scribe.builder.ServiceBuilder;
import org.scribe.builder.api.FacebookApi;
import org.scribe.model.OAuthRequest;
import org.scribe.model.Response;
import org.scribe.model.Token;
import org.scribe.model.Verb;
import org.scribe.model.Verifier;
import org.scribe.oauth.OAuthService;

import com.almende.denetwerkscan.Contact;
import com.almende.denetwerkscan.ContactService;
import com.almende.denetwerkscan.CurrentUser;
import com.almende.denetwerkscan.PersonService;
import com.almende.denetwerkscan.entity.Person;
import com.almende.denetwerkscan.entity.Person.GENDER;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@SuppressWarnings("serial")
public class ImportServlet extends HttpServlet {
	// TODO: do not hardcode urls
	private static String appUrl    = "http://denetwerkscan.appspot.com/#page=form&form=import";
	private static String importUrl = "http://denetwerkscan.appspot.com/import/";
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		CurrentUser user = new CurrentUser();
		if (!user.isLoggedIn()) {
			resp.sendError(403); // unauthorized
		}
				
		String serviceName = req.getParameter("service"); // for example "facebook"
		
		boolean containsVerifier = (req.getParameter("code") != null);
		
		if (serviceName != null) {
			OAuthService service = createService(serviceName);

			if (containsVerifier) {
				Token accessToken = obtainAccessToken(serviceName, service, req, resp);
				importFacebookFriends(serviceName, service, accessToken, req, resp);
				
				// redirect to app
				resp.sendRedirect(appUrl);
			}
			else {
				redirectToAuthorization(serviceName, service, req, resp);
			}
		}
		else {
			resp.getWriter().println(
					"<html><body>" +
					"<p>Kies een social media om contacten van te importeren:</p>" + 
					"<p><a href=\"?service=facebook\">Facebook</a></p>" +
					"</body></html>");
		}
	}
	
	private void redirectToAuthorization(String serviceName, OAuthService service, 
			HttpServletRequest req, HttpServletResponse resp) {
		try {
			Token requestToken = null;
			/* TODO
			ObjectDatastore datastore = new AnnotationObjectDatastore();
			if(serviceName.equals("facebook")) {
				requestToken = service.getRequestToken();
				OAuthToken oauthToken = new OAuthToken(requestToken.getToken(), 
						requestToken.getSecret());
				datastore.store(oauthToken);
			}
			*/
            String authUrl = service.getAuthorizationUrl(requestToken);
            
            resp.sendRedirect(authUrl);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private OAuthService createService(String serviceName) {
		OAuthService service = null;
		String callbackURL = importUrl;

		callbackURL += "?service=" + serviceName;

		/* TODO
		if(service.equals("twitter")) {
			this.service = new ServiceBuilder()
	        .provider(TwitterApi.class)
	        .apiKey(Twitter.OAUTH_KEY)
	        .apiSecret(Twitter.OAUTH_SECRET)
	        .callback(callbackURL)
	        .build();
		} else*/ if(serviceName.equals("facebook")) {
			service = new ServiceBuilder()
		        .provider(FacebookApi.class)
		        .apiKey(Facebook.OAUTH_KEY)
		        .apiSecret(Facebook.OAUTH_SECRET)
		        .callback(callbackURL)
		        .scope("email,user_birthday")
		        .build();
		}
		
		return service;
	}
	
	private Token obtainAccessToken(String serviceName, OAuthService service, 
			HttpServletRequest req, HttpServletResponse resp) throws IOException {
		Token accessToken = null;
		
		/* TODO
		if(service.equals("twitter")) {

			String oauthToken = req.getParameter("oauth_token");
			String oauthVerifier = req.getParameter("oauth_verifier");

			String secret = StringStore.getString(oauthToken);
			StringStore.dropEntity(oauthToken);

			Token requestToken = new Token(oauthToken, secret);

			Verifier v = new Verifier(oauthVerifier);
			Token accessToken = this.service.getAccessToken(requestToken, v);

			OAuthRequest request = new OAuthRequest(Verb.GET, "http://api.twitter.com/1/account/verify_credentials.json");
			this.service.signRequest(accessToken, request);
			Response response = request.send();

			ObjectMapper om = ParallelInit.getObjectMapper();
			ObjectNode res=null;
			try {
				res = om.readValue(response.getBody(), ObjectNode.class);
			} catch (Exception e) {
				log.warning("Unable to parse result");
			}

			storeAccount(accessToken, "@"+res.get("screen_name").asText(), service.toUpperCase());

		} else*/ if(serviceName.equals("facebook")) {
			String oauthVerifier = req.getParameter("code");
			Verifier verifier = new Verifier(oauthVerifier);
			accessToken = service.getAccessToken(null, verifier);
		}
		
		return accessToken;
	}

	private void importFacebookFriends (String serviceName, OAuthService service, 
			Token accessToken,
			HttpServletRequest req, HttpServletResponse resp) throws IOException {
		CurrentUser user = new CurrentUser();
		String userId = user.getId();
		ObjectMapper mapper = new ObjectMapper();
	
		// get me
		try {
			OAuthRequest reqMe = new OAuthRequest(Verb.GET, "https://graph.facebook.com/me");
			service.signRequest(accessToken, reqMe);
			Response respMe = reqMe.send();
			ObjectNode me = mapper.readValue(respMe.getBody(), ObjectNode.class);
			
			Person person = PersonService.get(userId);
			if (person == null) {
				person = new Person();
				person.setId(userId);
			}

			String name = me.has("name") ? me.get("name").asText() : null;
			if (name != null && person.getName() == null) {
				person.setName(name);
			}

			String gender = me.has("gender") ? me.get("gender").asText() : null;
			if (gender != null) {
				if (gender.equals("male")) {
					person.setGender(GENDER.MALE);
				}
				if (gender.equals("female")) {
					person.setGender(GENDER.FEMALE);
				}
			}

			String facebookId = me.has("id") ? me.get("id").asText() : null;
			if (facebookId != null) {
				person.setFacebookId(facebookId);
			}
			
			String birthday = me.has("birthday") ? me.get("birthday").asText() : null;
			if (birthday != null && person.getAge() == null) {
				person.setAge(getAge(birthday));
			}
			
			PersonService.put(person);			
		} catch (Exception e) {
			e.printStackTrace();
		}
	
		// get friends
		try {
			OAuthRequest reqFriends = new OAuthRequest(Verb.GET, 
					"https://graph.facebook.com/me/friends");
			service.signRequest(accessToken, reqFriends);
			Response respFriends = reqFriends.send();
			ObjectNode friends = mapper.readValue(respFriends.getBody(), ObjectNode.class);
			
			if (friends.has("data")) {
				ArrayNode data = (ArrayNode) friends.get("data");
				
				for (int i = 0; i < data.size(); i++) {
					ObjectNode friend = (ObjectNode) data.get(i);
					
					if (friend.has("id") && friend.has("name")) {
						Contact contact = new Contact(userId, "facebook",
								friend.get("id").asText(), friend.get("name").asText());
						ContactService.add(contact);
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}	
	
	/**
	 * Get Age from a date string 
	 * @param dateString   formatted as "MM/dd/yyyy"
	 * @return age
	 */
	private Integer getAge(String dateString) {
		final DateFormat df = new SimpleDateFormat("MM/dd/yyyy");
        final Calendar c = Calendar.getInstance();
    
        try {
            int yearToday = c.get(Calendar.YEAR);
            int monthToday = c.get(Calendar.MONTH);
        	int dateToday = c.get(Calendar.DAY_OF_MONTH);
            
        	c.setTime(df.parse(dateString));
        	
        	int yearBirth = c.get(Calendar.YEAR);
        	int monthBirth = c.get(Calendar.MONTH);
        	int dateBirth = c.get(Calendar.DAY_OF_MONTH);
        	
    	    int age = yearToday - yearBirth;
    	    int m = monthToday - monthBirth;
    	    if (m < 0 || (m == 0 && dateToday < dateBirth)) {
    	        age--;
    	    }
    	    return age;
            
		} catch (ParseException e) {}
	
	    return null;
	}
}
