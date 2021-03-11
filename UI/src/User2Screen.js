import React, { Component } from 'react';
import './App.css';
import btn_icon_0 from './images/btn_icon_0.png';
import btn_icon_back_user2 from './images/btn_icon_back_user2.png';

// UI framework component imports
import Appbar from 'muicss/lib/react/appbar';
import Container from 'muicss/lib/react/container';

export default class User2Screen extends Component {

  // Properties used by this component:
  // appActions, deviceInfo

  constructor(props) {
    super(props);
    
    this.state = {
      text: (<div> </div>),
      text_plainText: " ",
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  render() {
    let layoutFlowStyle = {};
    let baseStyle = {};
    if (this.props.transitionId && this.props.transitionId.length > 0 && this.props.atTopOfScreenStack && this.props.transitionForward) {
      baseStyle.animation = '0.25s ease-in-out '+this.props.transitionId;
    }
    if ( !this.props.atTopOfScreenStack) {
      layoutFlowStyle.height = '100vh';
      layoutFlowStyle.overflow = 'hidden';
    }
    
    const style_elBackground = {
      width: '100%',
      height: '100%',
     };
    const style_elBackground_outer = {
      backgroundColor: '#f6f6f6',
     };
    const style_elText = {
      fontSize: 56.1,
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    let cssClass_progress = 'circularProgressIndicator';
    if (this.props.appActions.isLoading()) 
      cssClass_progress += ' circularProgressIndicator-active';
    
    
    // Embedded HTML content for element 'embed'
    const htmlContent_embed = "";
    
    const style_elEmbed = {
      pointerEvents: 'auto',
     };
    
    const style_elIconButton = {
      display: 'block',
      textTransform: 'uppercase',
      backgroundImage: 'url('+btn_icon_0+')',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '77.778%',
      backgroundPosition: '50% 0%',
      color: '(null)',
      textAlign: 'left',
      backgroundColor: 'transparent',
     };
    
    return (
      <Container fluid={true} className="AppScreen User2Screen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elSpacer">
            <div />
          </div>
          
          <div className="elText">
            <div className="systemFontRegular" style={style_elText}>
              <div>{this.state.text}</div>
            </div>
          </div>
          
          <div className="elProgress">
            <div>
              <svg className={cssClass_progress}>
                <circle className="circularProgress-animatedPath" style={{stroke: '#0093d5'}} cx="25" cy="25" r="17" fill="none" strokeWidth="3" strokeMiterlimit="10" />
              </svg>
            </div>
          </div>
          
          <div className="embeddedContent elEmbed">
            <div style={style_elEmbed}>
              <div dangerouslySetInnerHTML={{__html: htmlContent_embed}}></div>
            </div>
          </div>
          
          <div className="elIconButton">
            <button className="actionFont" style={style_elIconButton} />
          </div>
        </div>
        <Appbar className="navBar">
          <div className="title">User 2</div>  <div className="backBtn" onClick={ (ev)=>{ this.props.appActions.goBack() } }><img src={btn_icon_back_user2} alt="" style={{width: '50%'}} /></div>
        </Appbar>
        
      </Container>
    )
  }
  
}
