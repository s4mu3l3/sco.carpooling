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

import it.smartcommunitylab.carpooling.model.RecurrentTravel;
import it.smartcommunitylab.carpooling.mongo.repos.RecurrentTravelRepository;
import it.smartcommunitylab.carpooling.mongo.repos.RecurrentTravelRepositoryCustom;
import it.smartcommunitylab.carpooling.utils.CarPoolingUtils;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

public class RecurrentTravelRepositoryImpl implements RecurrentTravelRepositoryCustom {

	@Autowired
	RecurrentTravelRepository recurrentTravelRepository;

	@Autowired
	MongoTemplate mongoTemplate;

	@Override
	public List<RecurrentTravel> searchTravelsToExtend(int window) {

		List<RecurrentTravel> travelsToExtend = new ArrayList<RecurrentTravel>();

		Long threshold = CarPoolingUtils.adjustNumberOfDaysToWhen(System.currentTimeMillis(), window);

		Criteria criteria = new Criteria().where("lastInstance").lte(threshold);

		Query query = new Query();
		query.addCriteria(criteria);

		travelsToExtend = mongoTemplate.find(query, RecurrentTravel.class);

		return travelsToExtend;
	}

}
