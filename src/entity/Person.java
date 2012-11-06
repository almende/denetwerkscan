package entity;

import java.io.Serializable;
import java.util.List;

import com.google.code.twig.annotation.Id;

@SuppressWarnings("serial")
public class Person implements Serializable {

	protected Person() {}
	
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
	}

	public String getTest() {
		return test;
	}

	public void setTest(String test) {
		this.test = test;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
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
	
	public List<Relation> getRelations() {
		return relations;
	}

	public void setRelations(List<Relation> relations) {
		this.relations = relations;
	}

	@Id private String id; // typically, the users email is used as id.
	private String test;   // name of the test, for example "Buurtlab 2011"
	private String name;
	private Integer age;
	private GENDER gender;
	private String profession;

	private List<Relation> relations;
	
	public enum GENDER {MALE, FEMALE};
}
