package com.almende.sot;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.*;

import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

import entity.Person;

@SuppressWarnings("serial")
public class PersonServlet extends HttpServlet {
	/**
	 * Get a Person or a list of persons
	 * 
	 * GET /persons/:id
	 * 
	 * When id is specified in the url, the person with that id will be 
	 * returned. If the person is not found, a 404 is returned.
     *
 	 * GET /persons/
 	 * 
	 * When id is not specified in the url, a list with all persons will be 
	 * returned. The results can be filtered and limited. By default, a list 
	 * with only the id and name of the persons is returned. If no persons are 
	 * found, an empty array will be returned
	 * 
	 * Query parameters:
	 * - {String} name           Filter by name
	 * - {String} test           Filter by test
	 * - {Number} limit          Maximum number of persons to retrieve
	 * - {Boolean} include_docs  If true, the complete person objects are 
	 *                           included in the response. If false, only the 
	 *                           id and name of the persons is returned.
	 */
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws JsonParseException, JsonMappingException, IOException {
		String id = getPersonId(req);

		// authorize the user
		if (!authorize(ACTION.GET, id)) {
			resp.sendError(403); 
			return;
		}

		if (id != null) {
			Person person = PersonService.get(id);
			if (person != null) {
				write(resp, person);
			}
			else {
				// return 404 not found when person == null
				resp.setStatus(404);
				resp.getWriter().write("Error: Person with id " + id + " not found");
			}
		}
		else {
			String name = req.getParameter("name");
			String test = req.getParameter("test");
			Integer limit = null;
			if (req.getParameter("limit") != null) {
				limit = Integer.valueOf(req.getParameter("limit"));
			}
			Boolean include_docs = false;
			if (req.getParameter("include_docs") != null) {
				include_docs = Boolean.valueOf(req.getParameter("include_docs"));
			}
			List<Person> persons = PersonService.find(name, test, limit);
			
			if (include_docs) {
				// return all persons
				write(resp, persons);
			}
			else {
				// extract the ids/names from the person and only return that
				ObjectMapper mapper = new ObjectMapper();
				ArrayNode nodes = mapper.createArrayNode();
				for (Person person : persons) {
					ObjectNode node = mapper.createObjectNode();
					node.put("id", person.getId());
					node.put("name", person.getName());
					nodes.add(node);
				}
				write(resp, nodes);
			}
		}
	}

	/**
	 * Create a new person
	 * 
	 * POST /persons/ 
	 * 
	 * The request body must contain a valid Person as JSON, for example:
	 *     {"name": "Jos de Jong", "age": 30, "relations": []}
	 */
	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws JsonParseException, JsonMappingException, ServletException, 
			IOException {
		String id = getPersonId(req);
		if (id != null) {
			throw new ServletException("unexpected id in url");
		}

		// authorize the user
		if (!authorize(ACTION.POST, null)) {
			resp.sendError(403); // not authorized
			return;
		}

		Person person = read(req, Person.class);
		Person updatedPerson = PersonService.put(person);
		write(resp, updatedPerson);
	}
	
	/**
	 * Update an existing person
	 * 
	 * PUT /persons/:id
	 * 
	 * The request body must contain a valid person as JSON. The id in the url
	 * must match the id in the Person Object.
	 */
	@Override
	public void doPut(HttpServletRequest req, HttpServletResponse resp)
			throws JsonParseException, JsonMappingException, ServletException, 
			IOException {
		String id = getPersonId(req);
		if (id == null) {
			throw new ServletException("id missing in url");
		}
			
		// authorize the user
		if (!authorize(ACTION.PUT, id)) {
			resp.sendError(403); // not authorized
			return;
		}

		Person person = read(req, Person.class);
		String currentId = person.getId();
		if (currentId != null && !currentId.equals(id)) {
			throw new ServletException ("Error: id in url does not match id in person");
		}
		person.setId(id);
		
		Person updatedPerson = PersonService.put(person);
		write(resp, updatedPerson);
	}
	
	/**
	 * Delete an existing Person by id
	 * 
	 * DELETE /persons/:id
	 * 
	 * Id must be the id of an existing person. If the id is not found, the 
	 * method will not throw an exception.
	 */
	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		String id = getPersonId(req);
		if (id == null) {
			throw new ServletException("id missing in url");
		}
		
		// authorize the user
		if (!authorize(ACTION.DELETE, id)) {
			resp.sendError(403); // not authorized
			return;
		}

		Person person = PersonService.get(id);
		if (person != null) {
			PersonService.delete(person);
		}
	}

	/**
	 * Authorize changing a person (get, put, post, delete)
	 * @param action
	 * @param id     The id of the person
	 * @return authorized    True if authorized, else false
	 */
	private boolean authorize(ACTION action, String id) {
		UserService userService = null;
		switch (action) {
			case GET:
				return true;
			
			case PUT:
			case POST:
			case DELETE:
				userService = UserServiceFactory.getUserService();
				if (userService.isUserLoggedIn()) {
					User user = userService.getCurrentUser();
					String email = user.getEmail();
					if (userService.isUserAdmin() || 
							(id != null && email != null && email.equals(id))) {
						return true;
					}
				}
		}

		return false;
	}

	// enumeration for authorization actions
	private enum ACTION {GET, PUT, POST, DELETE};
	
	/**
	 * Read the body of the given http request, which is supposed to contain a
	 * JSON object, and deserialize the JSON object into the requested 
	 * Java Object type.
	 * @param req
	 * @param type
	 * @return
	 * @throws JsonParseException
	 * @throws JsonMappingException
	 * @throws IOException
	 */
	private static <T> T read(HttpServletRequest req, Class<T> type) 
			throws JsonParseException, JsonMappingException, IOException {
		ObjectMapper mapper = new ObjectMapper();
		String body = streamToString(req.getInputStream());
		return mapper.readValue(body, type);
	}

	/**
	 * Write a Java Object as JSON into the given HTTP response body.
	 * @param req
	 * @param type
	 * @return
	 * @throws JsonParseException
	 * @throws JsonMappingException
	 * @throws IOException
	 */
	private static void write(HttpServletResponse resp, Object obj) 
			throws JsonGenerationException, JsonMappingException, IOException {
		ObjectMapper mapper = new ObjectMapper();
		resp.setContentType("application/json");
		resp.getWriter().write(mapper.writeValueAsString(obj));
	}
	
	/**
	 * Retrieve the person id from a url. Returns null if there is no such id 
	 * Expects a URI like "/persons/:id"
	 * @param req
	 * @return id
	 */
	private static String getPersonId(HttpServletRequest req) {
		String id = null;
		String uri = req.getRequestURI();
		String[] path = uri.split("/");
		if (path.length > 2) {
			//id = Long.valueOf(path[2]);
			id = path[2];
		}
		return id;
	}
	
	/**
	 * Convert a stream to a string
	 * @param in
	 * @return
	 * @throws IOException
	 */
	private static String streamToString(InputStream in) throws IOException {
		StringBuffer out = new StringBuffer();
		byte[] b = new byte[4096];
		for (int n; (n = in.read(b)) != -1;) {
			out.append(new String(b, 0, n));
		}
		return out.toString();
	}
}
