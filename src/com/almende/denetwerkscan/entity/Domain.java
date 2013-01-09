package com.almende.denetwerkscan.entity;

import java.io.Serializable;
import java.util.List;

import com.google.appengine.api.datastore.Blob;
import com.google.code.twig.annotation.Index;
import com.google.code.twig.annotation.Type;

@SuppressWarnings("serial")
public class Domain implements Serializable {
	public Domain() {}
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	public List<Relation> getRelations() {
		return relations;
	}
	public void setRelations(List<Relation> relations) {
		this.relations = relations;
	}

	@Index(false) private String name;
	@Index(false) @Type(Blob.class) private List<Relation> relations;
}
