// @flow
import React, { Children, cloneElement, Component, type ElementType } from 'react';
import { findDOMNode } from 'react-dom';

const THRESHOLD = 150;
const RESTRAINT = 100;
const ALLOWED_TIME = 1000;

const Container = ({ innerRef, ...props }) => <div ref={innerRef} style={{
  overflow: 'hidden',
	touchAction: 'pan-y',
  userSelect: 'none',
}} {...props} />;
const Frame = ({ innerRef, style, ...props }) => <div ref={innerRef} style={{
	float: 'left',
	height: '100%',
	minHeight: 1,
  ...style
}} {...props} />;

export default class Swipeable extends Component {
  surface: Node | null
  state = {
		index: 0,
    distX: 0,
    distY: 0,
    frameCount: 0,
    frameWidth: 0,
  }

  componentDidMount() {
    this.surface = findDOMNode(this);

    this.surface.addEventListener('touchstart', this.touchStart, false);
    this.surface.addEventListener('touchmove', this.touchMove, false);
    this.surface.addEventListener('touchend', this.touchEnd, false);

    this.init();
  }
  componentWillUnmount() {
    this.surface.removeEventListener('touchstart', this.touchStart, false);
    this.surface.removeEventListener('touchmove', this.touchMove, false);
    this.surface.removeEventListener('touchend', this.touchEnd, false);
  }

  init = () => {
    const frameCount = Children.count(this.props.children);
    const frameWidth = this.container.clientWidth;
    this.setState({ frameCount, frameWidth });
  }

  touchStart = (event) => {
    const { distX, distY } = this.state;
    const touchobj = event.changedTouches[0];

    event.preventDefault();

    console.log('touch start', distX, touchobj.pageX);

    this.setState({
      startX: touchobj.pageX - distX,
      startY: touchobj.pageY - distY,
      startTime: new Date().getTime(), // record time when finger first makes contact with surface
    });
  }
  touchMove = (event) => {
    event.preventDefault();
    const { startTime, startX, startY } = this.state;
    const touchobj = event.changedTouches[0];

    const distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
    const distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
    const elapsedTime = new Date().getTime() - startTime // get time elapsed

    this.setState({ distX, distY, elapsedTime });
  }
  touchEnd = (event) => {
    event.preventDefault();
    const { startTime, startX, startY } = this.state;
    const { onSwipeLeft, onSwipeRight } = this.props;
    const callback = { left: onSwipeLeft, right: onSwipeRight}
    const touchobj = event.changedTouches[0];

    const distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
    const distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
    const elapsedTime = new Date().getTime() - startTime // get time elapsed
    let direction;

    if (elapsedTime <= ALLOWED_TIME){ // first condition for awipe met
        if (Math.abs(distX) >= THRESHOLD && Math.abs(distY) <= RESTRAINT){ // 2nd condition for horizontal swipe met
            direction = (distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
        }
        // else if (Math.abs(distY) >= THRESHOLD && Math.abs(distX) <= RESTRAINT){ // 2nd condition for vertical swipe met
        //     direction = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
        // }
    }


    if (direction && callback[direction]) {
      callback[direction](this.state);
    }
    this.setState({ distX, distY, elapsedTime, direction }, () => {
      this.swipeEnd(direction);
    });
  }
  swipeEnd = (direction) => {
		if (this.state.isAnim) return;

    const { frameCount, frameWidth } = this.state;

    this.setState({ isAnim: true }, () => {
  		this.setState(state => {
  			let index = state.index;
        const max = frameCount - 1;

        if (direction === 'left') Math.min(max, ++index);
        if (direction === 'right') Math.max(0, --index);

        const distX = (index * frameWidth) * -1;

        console.log('swipeEnd', direction, index, distX);

  			return { distX, index }
  		});
    });
	}

  render() {
    const { children } = this.props;
    const { distX, frameCount, frameWidth, isAnim } = this.state;

		const transition = isAnim ? { transition: 'transform 500ms ease' } : {};

    return (
      <Container innerRef={r => this.container = r}>
        <div
          onTransitionEnd={() => this.setState({ isAnim: false })}
          style={{
            ...transition,
            transform: `translate3d(${distX}px, 0, 0)`,
            width: frameCount * frameWidth,
          }}
        >
          {Children.map(children, (child, idx) => (
            <Frame key={idx} style={{ width: frameWidth }}>
              {child}
            </Frame>
          ))}
        </div>
      </Container>
    );
  }
}
