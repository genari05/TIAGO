const getDistinctId = () => fetch(`http://localhost:54112/api/distinct_id`).then(response => {
	if (!response.ok) {
		throw new Error('Error fetching distinct_id');
	}

	return response.json().then(data => data.distinct_id);
}).catch(error => {
  console.error(error);
  return null;
})

const getSession = () => fetch(`http://localhost:54112/api/session`).then(response => {
	if (!response.ok) {
		throw new Error('Error fetching session');
	}

	return response.json();
}).catch(error => {
  console.error(error);
  return null;
})

module.exports = {
  getDistinctId,
  getSession
}