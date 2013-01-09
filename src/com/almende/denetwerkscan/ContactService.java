package com.almende.denetwerkscan;

import java.util.ArrayList;
import java.util.List;

import com.google.appengine.api.datastore.QueryResultIterator;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.code.twig.ObjectDatastore;
import com.google.code.twig.FindCommand.RootFindCommand;
import com.google.code.twig.annotation.AnnotationObjectDatastore;
import com.google.appengine.api.datastore.Key;

public class ContactService {
	/**
	 * Store a contact
	 * @param contact
	 */
	public static Contact add(Contact contact) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		Key key = datastore.store(contact);
		contact = datastore.load(key); // load to force updating of indexes
		return contact;
	}
	
	/**
	 * Retrieve all contacts of given userId
	 * @param userId
	 * @return
	 */
	public static List<Contact> find(String userId) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		RootFindCommand<Contact> command = datastore.find().type(Contact.class);
		command = command.addFilter("userId", FilterOperator.EQUAL, userId);
		QueryResultIterator<Contact> query = command.now();

		// retrieve all query results
		List<Contact> contacts = new ArrayList<Contact>();
		while (query.hasNext()) {
			contacts.add(query.next());
		}
		
		return contacts;
	}
	
	/**
	 * Test if there exists a userId with this given service and contactId
	 * @param userId
	 * @param service
	 * @param contactId
	 * @return
	 */
	public static boolean contains(String userId, String service, String contactId) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		RootFindCommand<Contact> command = datastore.find().type(Contact.class);
		command = command.addFilter("userId", FilterOperator.EQUAL, userId);
		command = command.addFilter("service", FilterOperator.EQUAL, service);
		command = command.addFilter("contactId", FilterOperator.EQUAL, contactId);
		QueryResultIterator<Contact> query = command.now();

		if (query.hasNext()) {
			return true;
		}
		
		return false;
	}
	
	/**
	 * Remove all contacts of given userId
	 * @param userId
	 * @param service   A service name like "facebook". 
	 *                  When service=="*", all services will be deleted
	 */
	public static void delete(String userId, String service) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		RootFindCommand<Contact> command = datastore.find().type(Contact.class);
		command = command.addFilter("userId", FilterOperator.EQUAL, userId);
		if (!service.equals("*")) {
			command = command.addFilter("service", FilterOperator.EQUAL, service);
		}
		QueryResultIterator<Contact> query = command.now();

		List<Contact> contacts = new ArrayList<Contact>();
		while (query.hasNext()) {
			contacts.add(query.next());
		}
		
		datastore.deleteAll(contacts);
	}
}
