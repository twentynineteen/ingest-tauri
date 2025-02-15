import { FaHome } from 'react-icons/fa';
import { IoSettingsOutline } from 'react-icons/io5';
import { NavLink } from 'react-router';
import { Outlet } from 'react-router-dom';

const Header = () => {
	const activeColour = 'text-white';
	const inactiveColour = 'text-gray-600';
	return (
		<div className="bg-gray-900">
			{/* <nav className="flex flex-row justify-around text-lg p-4 gap-8"> */}
			<nav className="flex flex-row justify-around p-4 text-xl font-semibold tracking-tight sm:text-xl items-center">
				<NavLink
					to="/"
					className={({ isActive }) => (isActive ? activeColour : inactiveColour)}
					end
				>
					<FaHome className="" />
				</NavLink>
				<NavLink
					to="/settings"
					className={({ isActive }) => (isActive ? activeColour : inactiveColour)}
					end
				>
					<IoSettingsOutline className="" />
				</NavLink>
				<NavLink
					to="/register"
					className={({ isActive }) => (isActive ? activeColour : inactiveColour)}
					end
				>
					register
				</NavLink>
				<NavLink
					to="/login"
					className={({ isActive }) => (isActive ? activeColour : inactiveColour)}
					end
				>
					login
				</NavLink>
			</nav>
			<Outlet />
		</div>
	);
};

export default Header;
