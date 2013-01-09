package com.almende.denetwerkscan;

import com.almende.denetwerkscan.entity.Person;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

/**
 * Helper class with method to authorize the current user
 */
public class CurrentUser {
	private UserService userService = null;
	private User user = null;

	public CurrentUser() {
		userService = UserServiceFactory.getUserService();
		user = userService.getCurrentUser();
	}
	
	public boolean isLoggedIn() {
		return userService.isUserLoggedIn();
	}

	public boolean isAdmin() {
		return userService.isUserAdmin();
	}

	/**
	 * Get the users id (its email). Can be null
	 * @return id
	 */
	public String getId() {
		return user.getEmail();
	}

	/**
	 * Test if the current user has the given id
	 * @param id
	 * @param isSelf
	 */
	public boolean isSelf(String id) {
		String userId = getId();
		if (userId == null || id == null) {
			return false;
		}

		return userId.equals(id);
	}
	
	/**
	 * Check whether this user is authorized to view a person
	 * @param other
	 * @return
	 */
	public boolean isAutorizedToView(Person person) {
		if (person == null) {
			return false;
		}
		if (!isLoggedIn()) {
			return false;
		}
		if (isAdmin()) {
			return true;
		}
		
		switch (person.getPrivacyPolicy()) {
			case PRIVATE:
				return (isSelf(person.getId()));

			case PUBLIC_FOR_RELATIONS:
				Person self = PersonService.get(getId());
				if (isSelf(person.getId())) {
					return true;
				}

				String facebookId = self.getFacebookId();
				if (facebookId != null && 
						ContactService.contains(person.getId(), "facebook", facebookId)) {
					return true;
				}
				return false;
				
			case PUBLIC:
				return true;

			default:
				return false;
		}
	}
}
