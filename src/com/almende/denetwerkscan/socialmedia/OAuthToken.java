package com.almende.denetwerkscan.socialmedia;

import java.io.Serializable;

import com.google.code.twig.annotation.Id;

@SuppressWarnings("serial")
public class OAuthToken implements Serializable {
	public OAuthToken () {}

	public OAuthToken (String token, String secret) {
		this.token = token;
		this.secret = secret;
	}

	@Id public String token = null;
	public String secret = null;
}
