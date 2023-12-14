import Link from "next/link";

const NavLink = ({href, title}) => {
  return (
    <Link href={href} 
      className='
      px-3 block py-2 pl-3 pr-4 
      sm:text-lg mb:p-0
      transition-colors duration-300
      rounded-full shadow-lg bg-slate-500
      hover:bg-slate-600 text-slate-100 shadow-slate-400/30
      '>
    {title}
    </Link>
  );
}

export default NavLink