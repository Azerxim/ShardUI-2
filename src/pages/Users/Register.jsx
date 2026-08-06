import Navbar from "../../components/Navigation/Navbar";
import Skeleton from '../../components/Objects/Skeleton';
import Register from '../../components/Objects/Users/Register';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function RegisterPage() {
  return (
    <>
      <Navbar active="register" />
      <Register />
    </>
  );
}