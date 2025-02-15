import React from 'react';
import { Outlet } from 'react-router';

type Props = {};

const Dashboard = (props: Props) => {
	return (
		<div>
			<h1>Dashboard</h1>
			{/* either home or settings */}
			<Outlet />
		</div>
	);
};

export default Dashboard;
