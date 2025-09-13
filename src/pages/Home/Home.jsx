import './Home.css'

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Hero from '../../components/Menus/Hero'
import Skeleton from '../../components/Skeleton'

export default function HomePage() {
  return (
    <div>
      {/* <h1>ShardUI 2</h1> */}
      <div className="flex items-center justify-center">
        <Skeleton></Skeleton>
      </div>
      {/* <Hero /> */}
    </div>
  );
}