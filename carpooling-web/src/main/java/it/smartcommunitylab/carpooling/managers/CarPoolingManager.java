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

package it.smartcommunitylab.carpooling.managers;

import it.sayservice.platform.smartplanner.data.message.Itinerary;
import it.smartcommunitylab.carpooling.model.Booking;
import it.smartcommunitylab.carpooling.model.Community;
import it.smartcommunitylab.carpooling.model.Travel;
import it.smartcommunitylab.carpooling.model.TravelProfile;
import it.smartcommunitylab.carpooling.model.TravelRequest;
import it.smartcommunitylab.carpooling.model.User;
import it.smartcommunitylab.carpooling.mongo.repos.CommunityRepository;
import it.smartcommunitylab.carpooling.mongo.repos.TravelRepository;
import it.smartcommunitylab.carpooling.mongo.repos.TravelRequestRepository;
import it.smartcommunitylab.carpooling.mongo.repos.UserRepository;
import it.smartcommunitylab.carpooling.utils.CarPoolingUtils;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 
 * @author nawazk
 *
 */
@Component
public class CarPoolingManager {

	@Autowired
	private TravelRequestRepository travelRequestRepository;
	@Autowired
	private TravelRepository travelRepository;
	@Autowired
	private CommunityRepository communityRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private MobilityPlanner mobilityPlanner;

	public List<TravelRequest> getTravelRequest(String userId) {
		return travelRequestRepository.findByUserId(userId);

	}

	public List<TravelRequest> getMonitoredTravelRequest(String userId) {
		return travelRequestRepository.findMonitoredTravelRequest(userId);
	}

	public void saveTravelRequest(TravelRequest travelRequest) {
		travelRequestRepository.save(travelRequest);
	}

	public List<Travel> getPassengerTrips(String passengerId) {
		return travelRepository.findTravelByPassengerId(passengerId);
	}

	public List<Travel> getDriverTrips(String userId) {
		return travelRepository.findTravelByDriverId(userId);
	}

	public List<Travel> searchTravels(TravelRequest travelRequest, String userId) {
		List<Travel> searchTravels = new ArrayList<Travel>();

		List<String> commIdsForUser = communityRepository.getCommunityIdsForUser(userId);

		searchTravels = travelRepository.searchTravels(commIdsForUser, travelRequest);

		if (travelRequest.isMonitored()) {
			travelRequestRepository.save(travelRequest);
		}

		return searchTravels;
	}
	

	public Travel saveTravel(Travel travel, String userId) {

		// search for plan.
		List<Itinerary> itns = mobilityPlanner.plan(travel);

		if (!itns.isEmpty()) {
			travel.setUserId(userId);
			travel.setRoute(itns.get(0));
			travel.setActive(true);
			for (Community community : communityRepository.findByUserId(userId)) {
				if (!travel.getCommunityIds().contains(community.getId())) {
					travel.getCommunityIds().add(community.getId());
				}
			}
		}
		travelRepository.save(travel);

		return travel;
	}

	public Travel bookTrip(String travelId, Booking reqBooking, String userId) {

		Travel travel = travelRepository.findOne(travelId);

		if (CarPoolingUtils.isValidUser(travel, userId, reqBooking)) {
			if (travel.getRecurrency() != null) { // recurrent travel.
				if (CarPoolingUtils.ifBookableRecurr(travel, reqBooking, userId)) {
					travel = CarPoolingUtils.updateTravel(travel, reqBooking, userId);
					travelRepository.save(travel);
				}

			} else if (!reqBooking.isRecurrent()) { //non-recurrent travel + non-recurrent requested booking.
				if (CarPoolingUtils.ifBookable(travel, reqBooking, userId)) {
					// update traveller.
					travel = CarPoolingUtils.updateTravel(travel, reqBooking, userId);
					travelRepository.save(travel);
				}
			}
		}

		return travel;
	}

	public Travel acceptTrip(String travelId, Booking booking, String userId) {

		Travel travel = travelRepository.findOne(travelId);

		for (Booking book : travel.getBookings()) {
			if (book.equals(booking)) {
				book.setAccepted(booking.getAccepted());
			}
		}
		
		travelRepository.save(travel);

		return travel;
	}

	public List<Community> readCommunities(String userId) {

		List<Community> communities = new ArrayList<Community>();
		communities = communityRepository.findByUserId(userId);

		return communities;
	}

	public TravelProfile saveTravelProfile(TravelProfile travelProfile, String userId) {

		User user = userRepository.findOne(userId);
		TravelProfile saveProfile = null;
		
		if (user != null) {
			user.setTravelProfile(travelProfile);
			user = userRepository.save(user);
			saveProfile = user.getTravelProfile();
		}
		
		return saveProfile;

	}

	public TravelProfile readTravelProfile(String userId) {

		TravelProfile travelProfile = null;
		User user = userRepository.findOne(userId);
		
		if (user != null) {
			travelProfile = user.getTravelProfile();
		}
		
		return travelProfile;

	}

}
