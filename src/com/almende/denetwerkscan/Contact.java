package com.almende.denetwerkscan;

import com.google.code.twig.annotation.Id;
import com.google.code.twig.annotation.Index;

public class Contact {
	public Contact() {}
	
	public Contact(String userId, String service, String contactId, 
			String contactName) {
		setKey(service + ":" + userId + ":" + contactId);
		setUserId(userId);
		setService(service);
		setContactId(contactId);
		setContactName(contactName);
	}
	
	public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	
	public String getService() {
		return service;
	}
	public void setService(String service) {
		this.service = service;
	}
	
	public String getContactName() {
		return contactName;
	}
	public void setContactName(String contactName) {
		this.contactName = contactName;
	}
	
	public String getContactId() {
		return contactId;
	}
	
	public void setContactId(String contactId) {
		this.contactId = contactId;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	@Id private String key;
	private String userId;
	private String service; // facebook, twitter, linkedin
	private String contactId;
	@Index(false) private String contactName;
}
