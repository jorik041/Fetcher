import React, {useEffect, useState} from "react";
import '../styles/HeaderBar.css';
import SearchBar from "./SearchBar";
import Sidebar from "./Sidebar";


const HeaderBar = () => {

    return (
        <div className='HeaderBar'>
            <SearchBar/>
            <Sidebar/>
        </div>
    );
};

export default HeaderBar

