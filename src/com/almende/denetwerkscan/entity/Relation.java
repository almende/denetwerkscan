package com.almende.denetwerkscan.entity;

import java.io.Serializable;

import com.google.code.twig.annotation.Index;

@SuppressWarnings("serial")
public class Relation implements Serializable {
	public Relation() {}
	
	public Relation(String name, String frequency) {
		this.name = name;
		this.frequency = frequency;
	}
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getFrequency() {
		return frequency;
	}

	public void setFrequency(String frequency) {
		this.frequency = frequency;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getFacebookId() {
		return facebookId;
	}

	public void setFacebookId(String facebookId) {
		this.facebookId = facebookId;
	}

	@Index(false) private String name;      // name of the friend
	@Index(false) private String id;        // optional. id of the person in De Netwerk Scan
	@Index(false) private String facebookId;// optional facebookId
	@Index(false) private String frequency; // daily, weekly, monthly, yearly, ...
}
