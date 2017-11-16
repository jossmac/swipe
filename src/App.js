import React, { Component } from 'react';
import Lorem from 'react-lorem-component';
import Swipeable from './components/Swipeable'

const Target = props => <div style={{
  backgroundColor: '#eee',
  borderRadius: 4,
  margin: 10,
  padding: 20,
  textAlign: 'center',
}} {...props} />;

class App extends Component {
  swipedLeft = (state) => {
    // console.log('swiped left', state);
  }
  swipedRight = (state) => {
    // console.log('swiped right', state);
  }
  render() {
    return (
      <div className="App">
        <Lorem count={1} />
        <Swipeable onSwipeLeft={this.swipedLeft} onSwipeRight={this.swipedRight}>
          {[1,2,3,4].map(t => <Target key={t}>Swipe me {t}</Target>)}
        </Swipeable>
        <Lorem count={5} />
      </div>
    );
  }
}

export default App;
