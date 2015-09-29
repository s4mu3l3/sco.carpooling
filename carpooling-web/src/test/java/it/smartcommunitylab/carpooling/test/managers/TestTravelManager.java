/**
 * Copyright 2015 Smart Community Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package it.smartcommunitylab.carpooling.test.managers;

import it.smartcommunitylab.carpooling.managers.CarPoolingManager;
import it.smartcommunitylab.carpooling.model.Booking;
import it.smartcommunitylab.carpooling.model.Travel;
import it.smartcommunitylab.carpooling.model.TravelRequest;
import it.smartcommunitylab.carpooling.model.Traveller;
import it.smartcommunitylab.carpooling.model.Zone;
import it.smartcommunitylab.carpooling.mongo.repos.TravelRepository;
import it.smartcommunitylab.carpooling.mongo.repos.TravelRequestRepository;
import it.smartcommunitylab.carpooling.test.TestConfig;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ArrayNode;
import org.junit.After;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * 
 * @author nawazk
 *
 */
@org.junit.Ignore
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = { TestConfig.class })
public class TestTravelManager {

	@Autowired
	private TravelRequestRepository travelRequestRepository;
	@Autowired
	private CarPoolingManager travelManager;
	@Autowired
	private TravelRepository travelRepository;
	@Autowired
	private Environment env;

	private ObjectMapper mapper = new ObjectMapper();

	@After
	public void init() {
		travelRequestRepository.deleteAll();
		travelRepository.deleteAll();
	}

	@Test
	public void testTravelProfileRepo() {
		TravelRequest travelRequest = new TravelRequest();
		travelRequest.setUserId("66");
		travelRequest.setFrom(new Zone("Trento Nord", "Trento Nord, 38121", 46.45, 11.11, 0));
		travelRequest.setTo(new Zone("Trento Sud", "Trento Sud, 38123", 46.55, 11.12, 0));
		travelRequest.setMonitored(false);
		travelRequest.setWhen(System.currentTimeMillis());

		travelManager.saveTravelRequest(travelRequest);

		for (TravelRequest traRequest : travelManager.getTravelRequest("66")) {
			System.out.println(traRequest);
		}

		for (TravelRequest traRequest : travelManager.getMonitoredTravelRequest("66")) {
			System.out.println(traRequest);
		}

	}

	@Test
	public void testCreateBooking() {
		//		Zone from = new Zone("Trento Nord", "Trento Nord, 38121", 46.45, 11.11, 0);
		//		Zone to = new Zone("Trento Sud", "Trento Sud, 38123", 46.55, 11.12, 0);
		Date[] confirmed = new Date[1];
		confirmed[0] = new Date(System.currentTimeMillis());
		Date date = new Date(System.currentTimeMillis());
		//		Travel travel = new Travel();
		Traveller traveller = new Traveller("52", "Nawaz", "Khurshid", "nawaz1981@gmail.com");

		for (Travel travel : travelRepository.findAll()) {
			Booking booking = new Booking(traveller, false, date, confirmed, 1);
			booking.setTraveller(traveller);
			booking.setDate(new Date(System.currentTimeMillis()));
			booking.setConfirmed(confirmed);
			booking.setAccepted(1);
			travel.getBookings().add(booking);
			travelRepository.save(travel);
		}

		//		travel.setFrom(from);
		//		travel.setTo(to);
		//		travel.setUserId("52");

		//	Booking[] bookings = travel.getBookings();
		//bookings[bookings.length] = booking;

		//travel.setBookings(bookings);

	}

	@Test
	public void testSearchTravel() throws JsonProcessingException, IOException {

		// construct ref Travel from json file.
		InputStream jsonlFile = Thread.currentThread().getContextClassLoader().getResourceAsStream("travel.json");
		JsonNode rootNode = mapper.readTree(jsonlFile);
		ArrayNode arrayNode = (ArrayNode) rootNode;
		for (JsonNode node : arrayNode) {
			travelRepository.save(mapper.convertValue(node, Travel.class));
		}

		TravelRequest travelRequest = new TravelRequest();
		travelRequest.setFrom(new Zone("Via Fiume", "Via Fiume", 46.065487, 11.131346, 0));
		travelRequest.setTo(new Zone("Muse", "Muse", 46.063266, 11.113062, 0));
		travelRequest.setWhen(1443425400000L); //09:30am (Sept 28)

		List<String> commIdsForUser = new ArrayList<String>() {
			{
				add("cPCommunity1");
				add("cPCommunity2");
			}
		};
		List<Travel> travels = travelRepository.searchTravels(commIdsForUser, travelRequest);

		Assert.assertFalse(travels.isEmpty());

		for (Travel travel : travels) {
			System.out.println(travel.getId());
		}

	}

}
