package com.almende.sot;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.QueryResultIterator;
import com.google.code.twig.FindCommand.RootFindCommand;
import com.google.code.twig.ObjectDatastore;
import com.google.code.twig.annotation.AnnotationObjectDatastore;

import entity.Person;

public class PersonService {
	private PersonService() {}
	
	/**
	 * Find a person by name
	 * @param name (optional)
	 * @param test (optional)
	 * @param limit (optional)
	 * @return persons
	 * @throws Exception
	 */
	public static List<Person> find(String name, String test, Integer limit) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		RootFindCommand<Person> command = datastore.find().type(Person.class);
		if (test != null) {
			command = command.addFilter("test", FilterOperator.EQUAL, test);
		}
		/* TODO: name search, but the following is case sensitive and 
		 * only searches for "starts with"
		if (name != null) {
			command = command.addFilter("name", FilterOperator.GREATER_THAN_OR_EQUAL, name);
			command = command.addFilter("name", FilterOperator.LESS_THAN, name + "\ufffd");
		}
		*/
		if (limit != null) {
			command = command.fetchMaximum(limit);
		}
		command = command.addSort("name");
		QueryResultIterator<Person> query = command.now();

		// TODO: querying over all Persons to filter by name is slow/expensive.
		// implement real full text search?
		List<Person> persons = new ArrayList<Person>();
		while (query.hasNext()) {
			Person person = query.next();
			if (person != null) {
				String pName = person.getName();
				// filter by name
				if (name == null) {
					persons.add(person); // not filtered
				}
				else if ((pName != null && pName.toLowerCase().contains(name))) {
					persons.add(person);
				}
			}
		}
		
		return persons;
	}
	
	/**
	 * Get a person by its id
	 * @param id
	 * @return
	 * @throws Exception
	 */
	public static Person get(String id) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		Person person = datastore.load(Person.class, id);
		return person;
	}
	
	/**
	 * Store or update a person in the database. If the provided person has
	 * no id, a new, random UUID is used as id.
	 * @param person
	 * @return
	 * @throws Exception
	 */
	public static Person put(Person person) {
		if (person.getId() == null) {
			String id = UUID.randomUUID().toString();
			person.setId(id);
		}
		
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		datastore.storeOrUpdate(person);
		
		// retrieve the stored person again, 
		// to force the Datastore to update its indexes.
		Person updatedPerson = datastore.load(Person.class, person.getId());
		return updatedPerson;
	}
	
	/**
	 * Delete a person from the database
	 * @param person
	 * @return
	 * @throws Exception
	 */
	public static String delete(Person person) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		datastore.associate(person);
		datastore.delete(person);
		
		// retrieve the stored person again (this will return null), 
		// to force the Datastore to update its indexes. 
		datastore.load(Person.class, person.getId());
		
		return "Person deleted";
	}
}
