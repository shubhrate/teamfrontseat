import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';
import Container from 'muicss/lib/react/container';

export default class LaunchScreen extends Component {

  // Properties used by this component:
  // appActions, deviceInfo

  constructor(props) {
    super(props);
    
    this.state = {
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  onClick_elButton = async (ev) => {
    // Go to screen 'User'
    this.props.appActions.goToScreen('user', { transitionId: 'fadeIn' });
  
  }
  
  
  onClick_elButton2 = async (ev) => {
    // Go to screen 'Guide'
    this.props.appActions.goToScreen('guide', { transitionId: 'fadeIn' });
  
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
    
    const style_elButton = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elButton2 = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    return (
      <Container fluid={true} className="AppScreen LaunchScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elText">
            <div className="systemFontRegular" style={style_elText}>
              <div>{this.props.locStrings.start_text_281915}</div>
            </div>
          </div>
          
          <div className="elButton">
            <Button className="actionFont" style={style_elButton}  color="accent" onClick={this.onClick_elButton} >
              {this.props.locStrings.start_button_947759}
            </Button>
          </div>
          
          <div className="elButton2">
            <Button className="actionFont" style={style_elButton2}  color="accent" onClick={this.onClick_elButton2} >
              {this.props.locStrings.start_button2_619751}
            </Button>
          </div>
        </div>
        
      </Container>
    )
  }
  
}
