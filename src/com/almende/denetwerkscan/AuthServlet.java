package com.almende.denetwerkscan;

import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")
public class AuthServlet extends HttpServlet {
	/**
	 * Retrieve user information. Returns a JSON object containing fields:
	 *     {String} loginUrl
	 *     {String} logoutUrl
	 *     {Boolean} isLoggedIn
	 * When a user is logged in (isLoggedIn==true), the following fields are
	 * provided:
	 *     {Boolean} isAdmin
	 *     {String} email
	 *     {String} nickname
	 */
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp) {
		String url = "/";

		// docs: https://developers.google.com/appengine/docs/java/users/overview
		UserService userService = UserServiceFactory.getUserService();
		
		ObjectMapper mapper = new ObjectMapper();
		ObjectNode info = mapper.createObjectNode();
		info.put("loginUrl", userService.createLoginURL(url));
		info.put("logoutUrl", userService.createLogoutURL(url));
		info.put("isLoggedIn", userService.isUserLoggedIn());
		if (userService.isUserLoggedIn()) {
			info.put("isAdmin", userService.isUserAdmin());
			User user = userService.getCurrentUser();
			if (user != null) {
				info.put("nickname", user.getNickname());
				info.put("email", user.getEmail());
				//info.put("federatedIdentity", user.getFederatedIdentity());
				//info.put("userid", user.getUserId());
			}
		}

		resp.addHeader("Content-Type", "application/json");
		try {
			resp.getWriter().write(mapper.writeValueAsString(info));
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
