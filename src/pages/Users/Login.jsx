import Navbar from "../../components/Navigation/Navbar";
import Skeleton from '../../components/Objects/Skeleton';
import Login from '../../components/Objects/Users/Login';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function LoginPage() {
  return (
    <>
      <Navbar active="login" />
      <Login />
    </>
  );
}