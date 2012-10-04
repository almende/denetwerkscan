package entity;

import java.io.Serializable;

@SuppressWarnings("serial")
public class Relation implements Serializable {
	public Relation() {}
	
<<<<<<< HEAD
	public Relation(String name, String domain, String frequency, Long weight) {
		this.name = name;
		this.domain = domain;
		this.frequency = frequency;
		this.weight = weight;
=======
	public Relation(String name, String domain, String frequency) {
		this.name = name;
		this.domain = domain;
		this.frequency = frequency;
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
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
<<<<<<< HEAD
	public Long getweight(){
		return weight;
	}
	public void setweight(Long weight){
		this.weight = weight;
	}
=======
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd

	private String name;        // Name of the friend
	private String domain;      // School, Sports, neighbors, ...
	private String frequency;   // every day, once per month, ...
<<<<<<< HEAD
	private Long weight; // weight assigned based on domain priority
=======
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
}
