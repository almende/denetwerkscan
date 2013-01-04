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
	 * Find a person by name. Search is case insensitive.
	 * Note that a search can never return more than 1000 results.
	 * @param name (optional)
	 * @param limit (optional)
	 * @return persons
	 * @throws Exception
	 */
	public static List<Person> find(String name, Integer limit) {
		ObjectDatastore datastore = new AnnotationObjectDatastore();
		RootFindCommand<Person> command = datastore.find().type(Person.class);
		if (name != null) {
			String nameLowerCase = name.toLowerCase();
			command = command.addFilter("nameLowerCase", 
					FilterOperator.GREATER_THAN_OR_EQUAL, nameLowerCase);
			command = command.addFilter("nameLowerCase", 
					FilterOperator.LESS_THAN, nameLowerCase + "\ufffd");
		}
		if (limit != null) {
			// fetchMaximum is zero based or something? Anyway, add 1 to the
			// limit, then we actually retrieve 10 persons when limit=10
			command = command.fetchMaximum(limit + 1);
		}
		command = command.addSort("nameLowerCase");
		QueryResultIterator<Person> query = command.now();

		// retrieve all query results
		List<Person> persons = new ArrayList<Person>();
		while (query.hasNext()) {
			persons.add(query.next());
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
