import Link from "next/link";

const NavLink = ({href, title}) => {
  return (
    <Link href={href} 
      className='
      hover:bg-gray-800 rounded-xl 
      px-3 block py-2 pl-3 pr-4 text-[#ADB7BE] 
      sm:text-xl mb:p-0 hover:text-white'>
    {title}
    </Link>
  );
}

export default NavLink