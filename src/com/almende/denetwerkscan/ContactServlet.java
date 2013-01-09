package com.almende.denetwerkscan;

import java.io.IOException;
import java.util.List;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;


@SuppressWarnings("serial")
public class ContactServlet extends HttpServlet {
	/**
	 * Retrieve the imported contacts of logged in user
	 */
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws JsonParseException, JsonMappingException, IOException {
		CurrentUser user = new CurrentUser();
		if (!user.isLoggedIn()) {
			resp.sendError(403); // unauthorized
		}
		
		List<Contact> contacts = ContactService.find(user.getId());
		ObjectMapper mapper = new ObjectMapper();
		mapper.writeValue(resp.getWriter(), contacts);
	}
	
	/**
	 * Delete the imported contacts of logged in user
	 */
	@Override
	public void doDelete(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		CurrentUser user = new CurrentUser();
		if (!user.isLoggedIn()) {
			resp.sendError(403); // unauthorized
		}
		
		String serviceName = req.getParameter("service");
		if (serviceName == null) {
			resp.setStatus(400); // bad request
			resp.getWriter().println("Query parameter 'service' missing.");
			return;
		}
		
		ContactService.delete(user.getId(), serviceName);
	}
}
