import React, {useState, useEffect} from 'react';
import './Options.css';
import MainPanel from "./containers/MainPanel";
import HeaderBar from "./containers/HeaderBar";

const Options = () => {

  return (
    <div className="OptionsContainer">
      <HeaderBar/>
      <MainPanel />
    </div>
  );
};

export default Options;
