package com.almende.denetwerkscan.entity;

import java.io.Serializable;
import java.util.List;

import com.google.appengine.api.datastore.Blob;
import com.google.code.twig.annotation.Id;
import com.google.code.twig.annotation.Index;
import com.google.code.twig.annotation.Type;

@SuppressWarnings("serial")
public class Person implements Serializable {
	public Person() {}
	
	public Person(String name, String profession, Integer age, GENDER gender ) {
		this.profession = profession;
		this.name = name;
		this.age = age;
		this.gender = gender;
		
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
		if (nameLowerCase == null) {
			nameLowerCase = id;
		}
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
		this.nameLowerCase = (name != null) ? name.toLowerCase() : id;
	}

	public Integer getAge() {
		return age;
	}

	public void setAge(Integer age) {
		this.age = age;
	}

	public GENDER getGender() {
		return gender;
	}

	public void setGender(GENDER gender) {
		this.gender = gender;
	}
	
	public String getProfession(){
		return profession;
	}
	
	public void setProfession(String profession){
		this.profession = profession;
	}
	
	public PRIVACY_POLICY getPrivacyPolicy() {
		return privacyPolicy;
	}

	public void setPrivacyPolicy(PRIVACY_POLICY privacyPolicy) {
		this.privacyPolicy = privacyPolicy;
	}

	public List<Domain> getDomains() {
		return domains;
	}

	public void setDomains(List<Domain> domains) {
		this.domains = domains;
	}
	
	public String getFacebookId() {
		return facebookId;
	}

	public void setFacebookId(String facebookId) {
		this.facebookId = facebookId;
	}

	@Id private String id; // typically, the users email is used as id.
	private String facebookId;
	@Index(false) private String name;
	private String nameLowerCase;  // for indexed search on lower case name
	@Index(false) private PRIVACY_POLICY privacyPolicy = PRIVACY_POLICY.PUBLIC_FOR_RELATIONS;
	@Index(false) private Integer age;
	@Index(false) private GENDER gender;
	@Index(false) private String profession;
	@Index(false) @Type(Blob.class) private List<Domain> domains;
	
	public enum GENDER {MALE, FEMALE};
	public enum PRIVACY_POLICY {PRIVATE, PUBLIC_FOR_RELATIONS, PUBLIC};
}

