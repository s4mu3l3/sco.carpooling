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

package it.smartcommunitylab.carpooling.mongo.repos;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;

import it.smartcommunitylab.carpooling.model.RecurrentTravel;

public interface RecurrentTravelRepository
		extends PagingAndSortingRepository<RecurrentTravel, String>, RecurrentTravelRepositoryCustom {

	@Query("{'userId':?0}")
	List<RecurrentTravel> findTravelByDriverId(String userId);

	@Query("{'userId':?0}")
	Page<RecurrentTravel> findTravelByDriverId(String userId, Pageable pageable);

	@Query("{'id':?0, 'userId':?1}")
	RecurrentTravel findTravelByIdAndDriverId(String id, String userId);

}
