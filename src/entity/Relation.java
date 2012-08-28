package entity;

import java.io.Serializable;

@SuppressWarnings("serial")
public class Relation implements Serializable {
	public Relation() {}
	
	public Relation(String name, String domain, String frequency) {
		this.name = name;
		this.domain = domain;
		this.frequency = frequency;
	}
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDomain() {
		return domain;
	}

	public void setDomain(String domain) {
		this.domain = domain;
	}

	public String getFrequency() {
		return frequency;
	}

	public void setFrequency(String frequency) {
		this.frequency = frequency;
	}

	private String name;        // Name of the friend
	private String domain;      // School, Sports, neighbors, ...
	private String frequency;   // every day, once per month, ...
}
