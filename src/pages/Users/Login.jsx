import Navbar from "../../components/Navigation/Navbar";
import Skeleton from '../../components/Sections/Skeleton';
import Login from '../../components/Sections/Users/Login';
import './Login.css'

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function LoginPage() {
  return (
    <>
      <Navbar active="login" />
      <Login />
    </>
  );
}