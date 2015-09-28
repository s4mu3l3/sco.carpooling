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

package it.smartcommunitylab.carpooling.mongo.repos.impl;

import it.smartcommunitylab.carpooling.model.Recurrency;
import it.smartcommunitylab.carpooling.model.Travel;
import it.smartcommunitylab.carpooling.model.Travel.Booking;
import it.smartcommunitylab.carpooling.model.TravelRequest;
import it.smartcommunitylab.carpooling.mongo.repos.TravelRepository;
import it.smartcommunitylab.carpooling.mongo.repos.TravelRepositoryCustom;
import it.smartcommunitylab.carpooling.utils.CarPoolingUtils;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.Sphere;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

public class TravelRepositoryImpl implements TravelRepositoryCustom {

	@Autowired
	TravelRepository travelRepository;

	@Autowired
	MongoTemplate mongoTemplate;
	
	@Override
	public List<Travel> findTravelByPassengerId(String userId) {
		List<Travel> travelsForPassenger = new ArrayList<Travel>();

		// check if bookings within travel has travellers with userId
		// Criteria criteria = new Criteria();
		// Query query = new Query();
		// criteria.where("booking.traveller.userId").is(userId);
		// query.addCriteria(criteria);
		// travelsForPassenger = mongoTemplate.find(query, Travel.class);

		for (Travel travel : travelRepository.findAll()) {
			for (Booking booking : travel.getBookings()) {
				if (booking.getTraveller().getUserId().equals(userId)) {
					travelsForPassenger.add(travel);
					break;
				}
			}
		}

		return travelsForPassenger;
	}

	@Override
	public List<Travel> getAllMatchedCommunityTravels(List<String> userCommunityIds) {
		List<Travel> matchedTravels = new ArrayList<Travel>();
		// criteria.
		Criteria criteria = new Criteria().where("communityIds").in(userCommunityIds);
		// query.
		Query query = new Query();
		query.addCriteria(criteria);

		matchedTravels = mongoTemplate.find(query, Travel.class);

		return matchedTravels;
	}

	@Override
	public List<Travel> getAllMatchedZoneTravels(TravelRequest travelRequest) {

		List<Travel> matchedTravels = new ArrayList<Travel>();

		Point pFrom = new Point(travelRequest.getFrom().getLatitude(), travelRequest.getFrom().getLongitude());
		Circle circleFrom = new Circle(pFrom, CarPoolingUtils.radius / 6371);
		Sphere sphereFrom = new Sphere(circleFrom);

		Point pTo = new Point(travelRequest.getTo().getLatitude(), travelRequest.getTo().getLongitude());
		Circle circleTo = new Circle(pTo, CarPoolingUtils.radius / 6371);
		Sphere sphereTo = new Sphere(circleTo);

		// criterias.
		Criteria criteriaF = new Criteria().where("from.coordinates").within(sphereFrom);
		Criteria criteriaT = new Criteria().where("to.coordinates").within(sphereTo);

		// query.
		Query query = new Query();
		// add criterias.
		query.addCriteria(criteriaF);
		query.addCriteria(criteriaT);

		matchedTravels = mongoTemplate.find(query, Travel.class);

		return matchedTravels;
	}

	@Override
	public List<Travel> getAllMatchedTimeTravels(TravelRequest travelRequest) {

		List<Travel> matchTravels = new ArrayList<Travel>();

		/** non recurrent time travels. **/
		Date reqDate = new Date(travelRequest.getWhen());
		// match +-1hr.
		Date timePlusOneHour = CarPoolingUtils.getTimeByOffset(reqDate, 1);
		Date timeMinusOneHour = CarPoolingUtils.getTimeByOffset(reqDate, -1);
		// recurrent data.
		int reqDOW = CarPoolingUtils.getDayOfWeek(reqDate);
		int reqDOM = CarPoolingUtils.getDayOfMonth(reqDate);
		int recurrTimePlusOneHour = CarPoolingUtils.getHour(timePlusOneHour);
		int recurrTimeMinusOneHour = CarPoolingUtils.getHour(timeMinusOneHour);

		Criteria criteriaNonRecurr = new Criteria().where("when").gte(timeMinusOneHour.getTime())
				.lte(timePlusOneHour.getTime()).and("active").is(true);

		/** recurrent travels. **/
		Criteria criteriaReccurGeneral = new Criteria().where("when").is(0).and("recurrency").exists(true)
				.and("active").is(true).and("recurrency.time").gte(recurrTimeMinusOneHour).lte(recurrTimePlusOneHour);
		Criteria criteriaReccurDOW = new Criteria().where("recurrency.days").in(reqDOW);
		Criteria criteriaRecurrDOM = new Criteria().where("recurrency.dates").in(reqDOM);

		Criteria subReccurr = new Criteria().orOperator(criteriaReccurDOW, criteriaRecurrDOM);
		Criteria criteraRecurr = new Criteria().andOperator(criteriaReccurGeneral, subReccurr);
		Criteria criteria = new Criteria().orOperator(criteriaNonRecurr, criteraRecurr);

		/**
		Query: {
			"$or": [{
				"when": {
					"$gte": 1443421800000,
					"$lte": 1443429000000
				},
				"active": true
			},
			{
				"$and": [{
					"when": 0,
					"recurrency": {
						"$exists": true
					},
					"active": true,
					"recurrency.time": {
						"$gte": 8,
						"$lte": 10
					}
				},
				{
					"$or": [{
						"recurrency.days": {
							"$in": [2]
						}
					},
					{
						"recurrency.dates": {
							"$in": [28]
						}
					}]
				}]
			}]
		}
		**/

		Query query = new Query();
		query.addCriteria(criteria);
		matchTravels = mongoTemplate.find(query, Travel.class);

		return matchTravels;
	}

	@Override
	public List<Travel> searchTravels(List<String> userCommunityIds, TravelRequest travelRequest) {
		
		List<Travel> travels = new ArrayList<Travel>();
		
		/** community. **/
		Criteria communityCriteria = new Criteria().where("communityIds").in(userCommunityIds);
		/** zone. **/
		Point pFrom = new Point(travelRequest.getFrom().getLatitude(), travelRequest.getFrom().getLongitude());
		Circle circleFrom = new Circle(pFrom, CarPoolingUtils.radius / 6371);
		Sphere sphereFrom = new Sphere(circleFrom);
		Point pTo = new Point(travelRequest.getTo().getLatitude(), travelRequest.getTo().getLongitude());
		Circle circleTo = new Circle(pTo, CarPoolingUtils.radius / 6371);
		Sphere sphereTo = new Sphere(circleTo);
		Criteria zoneCriteria = new Criteria().where("from.coordinates").within(sphereFrom).and("to.coordinates")
				.within(sphereTo);
		/** recurrent/non trip times. **/
		Date reqDate = new Date(travelRequest.getWhen());
		// match +-1hr.
		Date timePlusOneHour = CarPoolingUtils.getTimeByOffset(reqDate, 1);
		Date timeMinusOneHour = CarPoolingUtils.getTimeByOffset(reqDate, -1);
		// recurrent data.
		int reqDOW = CarPoolingUtils.getDayOfWeek(reqDate);
		int reqDOM = CarPoolingUtils.getDayOfMonth(reqDate);
		int recurrTimePlusOneHour = CarPoolingUtils.getHour(timePlusOneHour);
		int recurrTimeMinusOneHour = CarPoolingUtils.getHour(timeMinusOneHour);
		Criteria criteriaNonRecurr = new Criteria().where("when").gte(timeMinusOneHour.getTime())
				.lte(timePlusOneHour.getTime()).and("active").is(true);
		Criteria criteriaReccurGeneral = new Criteria().where("when").is(0).and("recurrency").exists(true)
				.and("active").is(true).and("recurrency.time").gte(recurrTimeMinusOneHour).lte(recurrTimePlusOneHour);
		Criteria criteriaReccurDOW = new Criteria().where("recurrency.days").in(reqDOW);
		Criteria criteriaRecurrDOM = new Criteria().where("recurrency.dates").in(reqDOM);
		Criteria subReccurr = new Criteria().orOperator(criteriaReccurDOW, criteriaRecurrDOM);
		Criteria criteraRecurr = new Criteria().andOperator(criteriaReccurGeneral, subReccurr);
		Criteria timeCriteria = new Criteria().orOperator(criteriaNonRecurr, criteraRecurr);

		Query query = new Query();
		query.addCriteria(communityCriteria);
		query.addCriteria(zoneCriteria);
		query.addCriteria(timeCriteria);
		
		travels = mongoTemplate.find(query, Travel.class);
		
		/** filter by posts/booking state. **/

		return travels;
	}

}
