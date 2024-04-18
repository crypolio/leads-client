import React from 'react';
import axios from 'axios';

import './App.css';

const TASK_STATUSES = ['Pending', 'Complete', 'Processing', 'Error'];

const SEARCH_PLACEHOLDER = 'https://google.com/maps/search/dental+clinic/@45.5627043,-73.7220155,13z/data=!3m1!4b1?entry=ttu';

const unixTimestampToDateTime = (unixTimestamp) =>{
	// Convert Unix timestamp to UTC date
	const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds

	// Check if the date is valid
	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}

	// Format date to YYYY-MM-DD HH:MM:SS
	return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

const parseUrl = (url = '') => {
	let res = null;

	const hasValidUrl = (
		url.includes('google') && 
		url.includes('search') &&
		url.includes('maps')
	);

	if (hasValidUrl) {
		res = url.split('search/')[1].split('/')[0].replace('+', ' ');
	}

	return res;
}

const App = () => {
	const [ loading, setLoading ] = React.useState(false);
	const [ searchUrl, setSearchUrl ] = React.useState('');
	const [ leadOptions, setLeadOptions ] = React.useState([]);
	const [ taskOptions, setTaskOptions ] = React.useState([]);

	React.useEffect(() => {
		handleRefreshTask();
	}, []);

	const hasLead = React.useMemo(() => (
		leadOptions && leadOptions.length
	), [ leadOptions ]);

	const hasTask = React.useMemo(() => (
		taskOptions && taskOptions.length
	), [ taskOptions ]);

	const handleChange = (event) => {
		setSearchUrl(event.target.value);
	};

	const handleRefreshTask = async () => {
		setLoading(true);

		fetchTask().then((tasks = []) => {
			const [ primaryTask ] = (tasks || []).filter(({ status }) => status === 1);

			fetchLead(primaryTask?.id);

			setLoading(false);
		}).catch(() => {
			setLoading(false);

			console.error('An error occured');
		});
	}

	const addTask = async () => {
		try {
			const response = await axios.post(
				'http://localhost:5050/v1/task/create',
				{ www: searchUrl }
			);

			fetchTask();
			setSearchUrl('');
		} catch (error) {
			console.error("Error fetching task data:", error);
		}
	};

	const fetchTask = async () => {
		try {
			const response = await axios.get(
				'http://localhost:5050/v1/task/list'
			);

			setTaskOptions(response.data.result);

			return response?.data?.result || [];
		} catch (error) {
			console.error("Error fetching task data:", error);
		}
	};

	const fetchLead = async (taskId = '') => {
		try {
			const response = await axios.get(
				`http://localhost:5050/v1/lead/${taskId}`
			);
			setLeadOptions(response.data.result);
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};

	const handleTaskSelection = (e, taskData) => {
		if (taskData?.status !== 1) return;

		fetchLead(taskData?.id);
	}

	return (
		<div className="container-fluid">
			<div className="row">
				<div className="col-md-12">
					<div className="grid search">
						<div className="grid-body">
							<div className="row">
								<div className={hasTask ? 'col-md-9' : 'col-md-12' }>
									<div className="card">
										<div className="card-body">
											<h2>
												<span className="small">
													<i className="bi-map" /> 
												</span>
												&nbsp;
												Google Map Lead Scrapper
											</h2>
											<hr />
											<div className="input-group">
												<input
													type="text"
													value={searchUrl}
													onChange={handleChange}
													className="form-control"
													placeholder={SEARCH_PLACEHOLDER}
												/>
												<span className="input-group-btn">
													<button className="btn btn-primary" type="button" onClick={addTask}>
														<i className="bi-search" />
													</button>
												</span>
											</div>

											{searchUrl && searchUrl.length && (
												<small>
													Showing all results matching <i>"{parseUrl(searchUrl)}"</i>
												</small>
											)}
										</div>
									</div>

									<div className="card mt-4">
										<div className="card-body">
											{loading ? (
												<div className="d-flex justify-content-center align-items-center vh-100 min-vh-50">
													<div className="spinner-border" role="status">
														<span className="visually-hidden">
															Loading...
														</span>
													</div>
												</div>
											) : (
												<div className="table-responsive mt-2">
													<table className="table table-hover">
														<thead>
															<tr>
																<th>Name</th>
																<th>Rating</th>
																<th>Reviews</th>
																<th>Category</th>
																<th>Address</th>
																<th>Phone</th>
																<th>Emails</th>
															</tr>
														</thead>
														<tbody>
															{leadOptions.map((lead, itemIdx) => (
																<tr key={lead.id}>
																	<td>
																		<a href={lead?.www}>
																			{lead?.name}
																		</a>
																	</td>
																	<td>
																		{lead?.rating}
																	</td>
																	<td>
																		{lead?.reviews}
																	</td>
																	<td>
																		{lead?.category}
																	</td>
																	<td>
																		{lead?.address}
																	</td>
																	<td>
																		{lead?.phone}
																	</td>
																	<td>
																		{lead?.emails && lead?.emails.length ? 
																			lead?.emails.map((email) => (
																				<small className="d-block">
																					{(email || '').toLowerCase()}
																				</small>
																			)) : 'N/A'}
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											)}
										</div>
									</div>
								</div>
								{hasTask ? (
									<div className="col-md-3">
										<div className="card">
											<div className="card-body">
												<div className="row">
													<div className="col-sm-6">
														<div className="float-start">
															<h2 className="grid-title">
																<small className="text-small">
																	<i className="bi-book" />
																</small>
																&nbsp;
																Tasks
															</h2>
														</div>
													</div>  
													<div className="col-sm-6">
														<div className="float-end">
															<a className="d-block mt-2" onClick={handleRefreshTask}>
																<i className="bi bi-arrow-repeat" />
															</a>
														</div>
													</div>  
												</div>
												<hr />
												{loading ? (
													<div className="d-flex justify-content-center align-items-center vh-100 min-vh-50">
														<div className="spinner-border" role="status">
															<span className="visually-hidden">
																Loading...
															</span>
														</div>
													</div>
												) : (
													<div className="table-responsive">
														<table className="table table-hover">
															<thead>
																<tr>
																	<th>#</th>
																	<th>Name</th>
																	<th>Status</th>
																	<th>Date</th>
																</tr>
															</thead>
															<tbody>
																{taskOptions.map((item, itemIdx) => (
																	<tr key={item.id} onClick={(e) => handleTaskSelection(e, item)}>
																		<td>
																			<small>
																				{itemIdx + 1}
																			</small>
																		</td>
																		<td>
																			<small>
																				{parseUrl(item.www)}
																			</small>
																		</td>
																		<td>
																			<small>
																				{TASK_STATUSES[item.status]}
																			</small>
																		</td>
																		<td>
																			<small>
																				{unixTimestampToDateTime(item.date_created)}
																			</small>
																		</td>
			
																		{/*
																		<td>
																			<div onClick={() => handleTaskSelection(item.id)}>
																				<i className="bi-eye" />
																			</div>
																		</td>
																		*/}
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}
											</div>
										</div>
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default App;
