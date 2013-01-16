package com.almende.denetwerkscan;

import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;

import javax.servlet.ServletException;
import javax.servlet.http.*;

import com.almende.denetwerkscan.entity.Person;
import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;


@SuppressWarnings("serial")
public class PersonServlet extends HttpServlet {
	private static ObjectMapper mapper = new ObjectMapper();
	
	/**
	 * Get a Person or a list of persons
	 * 
	 * GET /persons/:id
	 * 
	 * When id is specified in the url, the person with that id will be 
	 * returned. If the person is not found, a 404 is returned.
     *
     * Query parameters:
     * - {Boolean} include_relations Include all relations. Only relations
     *                               which are authorized for this current 
     *                               user will be included. 
     *
 	 * GET /persons/
 	 * 
	 * When id is not specified in the url, a list with all persons will be 
	 * returned. The results can be filtered and limited. By default, a list 
	 * with only the id and name of the persons is returned. If no persons are 
	 * found, an empty array will be returned
	 * 
	 * Query parameters:
	 * - {String} name               Filter by name
	 * - {Number} limit              Maximum number of persons to retrieve
	 * - {Boolean} include_persons   If true, the complete person objects are 
	 *                               included in the response. If false, only the 
	 *                               id and name of the persons is returned.
     * - {Boolean} include_relations Include all relations. Only relations
     *                               which are authorized for this current 
     *                               user will be included. Only applicable when
     *                               parameter include_persons is true. 
	 */
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws JsonParseException, JsonMappingException, IOException {
		String id = getPersonId(req);
		
		// read query parameters
		String name = req.getParameter("name");
		Integer limit = null;
		if (req.getParameter("limit") != null) {
			limit = Integer.valueOf(req.getParameter("limit"));
		}
		boolean include_persons = false;
		if (req.getParameter("include_persons") != null) {
			include_persons = Boolean.valueOf(req.getParameter("include_persons"));
		}		
		boolean include_relations = false;
		if (req.getParameter("include_relations") != null) {
			include_relations = Boolean.valueOf(req.getParameter("include_relations"));
		}
		
		// basic authorization: must be logged in
		CurrentUser user = new CurrentUser();
		if (!user.isLoggedIn()) {
			resp.sendError(403); 
			return;
		}

		if (id != null) {
			Person person = PersonService.get(id);
			if (person != null) {
				// authorize the user to view this person
				if (!user.isAutorizedToView(person)) {
					resp.sendError(403); 
					return;
				}
				
				if (include_relations) {
					// loop over all relations and retrieve them (when authorized)
					ObjectNode personWithRelations = mergeDomains(user, person);
					write(resp, personWithRelations);
				}
				else {
					write(resp, person);
				}
			}
			else {
				// return 404 not found when person == null
				resp.setStatus(404);
				resp.getWriter().write("Error: Person with id " + id + " not found");
			}
		}
		else {
			List<Person> persons = PersonService.find(name, limit);
			
			// TODO: improve performance by writing to stream.
			mapper = new ObjectMapper();
			ArrayNode nodes = mapper.createArrayNode();
			for (Person person : persons) {
				ObjectNode node;
				if (user.isAutorizedToView(person)) {
					if (include_persons) {
						// return the complete person
						if (include_relations) {
							// merge the persons relations
							node = mergeDomains(user, person);
						}
						else {
							node = mapper.convertValue(person, ObjectNode.class);
						}
					}
					else {
						// return the persons name and id (email)
						node = mapper.createObjectNode();
						node.put("name", person.getName());
						node.put("id", person.getId());
					}
				}
				else {
					// return the persons name only
					node = mapper.createObjectNode();
					node.put("name", person.getName());
				}
				nodes.add(node);
			}
			write(resp, nodes);
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
		CurrentUser user = new CurrentUser();
		boolean authorized = user.isLoggedIn();
		if (!authorized) {
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
		CurrentUser user = new CurrentUser();
		boolean authorized = user.isLoggedIn() && 
				(user.isAdmin() || user.isSelf(id));
		if (!authorized) {
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
		CurrentUser user = new CurrentUser();
		boolean authorized = user.isLoggedIn() && 
				(user.isAdmin() || user.isSelf(id));
		if (!authorized) {
			resp.sendError(403); // not authorized
			return;
		}

		Person person = PersonService.get(id);
		if (person != null) {
			PersonService.delete(person);
		}
	}

	/**
	 * Merge all relations into a persons data
	 * @param user
	 * @param person
	 * @return personWithRelations
	 */
	private static ObjectNode mergeDomains(CurrentUser user, Person person) {
		ObjectNode json = mapper.convertValue(person, ObjectNode.class);
		
		if (json.has("domains") && json.get("domains").isArray()) {
			ArrayNode domains = (ArrayNode) json.get("domains");
			for (int d = 0; d < domains.size(); d++) {
				if (domains.get(d).isObject()) {
					ObjectNode domain = (ObjectNode) domains.get(d);
					if (domain.has("relations") && domain.get("relations").isArray()) {
						ArrayNode relations = (ArrayNode) domain.get("relations");
						mergeRelations(user, relations);
					}
				}
			}
		}
		
		return json;
	}
	
	/**
	 * Merge all relations with the persons data
	 * @param user
	 * @param relations
	 */
	private static void mergeRelations(CurrentUser user, ArrayNode relations) {
		for (int r = 0; r < relations.size(); r++) {
			if (relations.get(r).isObject()) {
				ObjectNode relation = (ObjectNode) relations.get(r);
				mergeRelation(user, relation);
			}						
		}
	}
	
	/**
	 * Merge a single relation with the persons data
	 * @param user
	 * @param relation
	 */
	private static void mergeRelation(CurrentUser user, ObjectNode relation) {
		if (relation.has("facebookId") && relation.get("facebookId").isTextual()) {
			String facebookId = relation.get("facebookId").asText();
			if (facebookId != null && !facebookId.isEmpty()) {
	
				// search person by facebookId
				Person rel = PersonService.getByFacebookId(facebookId);
				if (rel != null && user.isAutorizedToView(rel)) {
					merge(relation, rel);
				}
			}
		}
	}
	
	/**
	 * Extend a JSON object with the parameters of a person
	 * @param json
	 * @param person
	 */
	private static void merge(ObjectNode json, Person person) {
		ObjectNode personJson = mapper.convertValue(person, ObjectNode.class);
		
		Iterator<Entry<String, JsonNode>> fields = personJson.fields();
		while (fields.hasNext()) {
			Entry<String, JsonNode> field = fields.next();
			json.put(field.getKey(), field.getValue());
		}
	}
	
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
		mapper = new ObjectMapper();
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
		mapper = new ObjectMapper();
		resp.setContentType("application/json");
		String s = mapper.writeValueAsString(obj);
		resp.getWriter().write(s);
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
