import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';
import Create from './Create';
import Dashboard from './Dashboard';
import Settings from './Settings';
import Sidebar from './Sidebar';
const Home: React.FC = () => {
	return (
		<div className="flex h-[calc(100vh-60px)]">
			<Sidebar />
			<div className="flex-1 p-5 bg-gray-100">
				<Routes>
					<Route index element={<Dashboard />} />
					<Route path="settings" element={<Settings />} />
					<Route path="login" element={<Login />} />
					<Route path="register" element={<Register />} />
					<Route path="create" element={<Create />} />
				</Routes>
			</div>
		</div>
	);
};

export default Home;
