package entity;

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

	@Index(false) private String name;        // Name of the friend
	@Index(false) private String frequency;   // every day, once per month, ...
}
