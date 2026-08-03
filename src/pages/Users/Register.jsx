import Navbar from "../../components/Navigation/Navbar";
import Skeleton from '../../components/Sections/Skeleton';
import Register from '../../components/Sections/Users/Register';

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function RegisterPage() {
  return (
    <>
      <Navbar active="register" />
      <Register />
    </>
  );
}