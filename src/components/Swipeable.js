// @jsx css
// @flow
import React, { Children, cloneElement, Component, type ElementType } from 'react';
import { findDOMNode } from 'react-dom';
import css from 'glam';

const THRESHOLD = 150;
const RESTRAINT = Math.round(THRESHOLD * 0.66);

const Div = ({ innerRef, ...props }) => <div ref={innerRef} {...props} />;

const Container = props => <Div css={{
  overflow: 'hidden',
  touchAction: 'pan-y',
  userSelect: 'none',
}} {...props} />;
const Track = props => <Div css={{
  display: 'block',
  left: 0,
  position: 'relative',
  top: 0,
}} {...props} />
const Item = props => <Div css={{
  float: 'left',
  height: '100%',
  minHeight: 1,
}} {...props} />;

export default class Swipeable extends Component {
  container: Node | null
  state = {
  index: 0,
    distX: 0,
    distY: 0,
    frameCount: 0,
    frameWidth: 0,
  }

  componentDidMount() {
    this.container = findDOMNode(this);

    this.container.addEventListener('touchstart', this.touchStart, false);
    this.container.addEventListener('touchmove', this.touchMove, false);
    this.container.addEventListener('touchend', this.touchEnd, false);

    this.init();
  }
  componentWillUnmount() {
    this.container.removeEventListener('touchstart', this.touchStart, false);
    this.container.removeEventListener('touchmove', this.touchMove, false);
    this.container.removeEventListener('touchend', this.touchEnd, false);
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
    const { index, frameWidth, startTime, startX, startY } = this.state;
    const { onSwipeLeft, onSwipeRight } = this.props;
    const callback = { left: onSwipeLeft, right: onSwipeRight}
    const touchobj = event.changedTouches[0];

    const distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
    const distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
    const elapsedTime = new Date().getTime() - startTime // get time elapsed
    let direction;

    const TRAVEL = index * frameWidth * -1;

    // ensure adequate distance travelled, along ONLY the correct axis
    if (Math.abs(distX) >= THRESHOLD && Math.abs(distY) <= RESTRAINT){
        console.log(distX, TRAVEL);
        direction = (distX < TRAVEL)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
    }
    // else if (Math.abs(distY) >= THRESHOLD && Math.abs(distX) <= RESTRAINT){
    //     direction = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
    // }

    if (direction && callback[direction]) {
      callback[direction](this.state);
    }

    // double set state to ensure "transition" property is available
    this.setState({
      direction,
      distX,
      distY,
      elapsedTime,
      isAnim: true,
    }, this.swipeEnd);
  }
  swipeEnd = () => {
    const { elapsedTime, direction, frameCount, frameWidth } = this.state;
    let index = this.state.index;
    const max = frameCount - 1;

    if (direction === 'left') Math.min(max, ++index);
    if (direction === 'right') Math.max(0, --index);

    const distX = (index * frameWidth) * -1;

    console.log('swipeEnd', direction, index, distX);

    this.setState({ distX, index });
  }

  render() {
    const { children } = this.props;
    const { distX, frameCount, frameWidth, isAnim } = this.state;

  const transition = isAnim ? { transition: 'transform 500ms ease' } : {};

    return (
      <Container>
        <Track
          onTransitionEnd={() => this.setState({ isAnim: false })}
          style={{
            ...transition,
            transform: `translate3d(${distX}px, 0, 0)`,
            width: frameCount * frameWidth,
          }}
        >
          {Children.map(children, (child, idx) => (
            <Item key={idx} style={{ width: frameWidth }}>
              {child}
            </Item>
          ))}
        </Track>
      </Container>
    );
  }
}
