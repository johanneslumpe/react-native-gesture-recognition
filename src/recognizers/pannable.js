'use strict';
import PropTypes from 'prop-types';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder, Animated } from 'react-native';

const initialState = {
  absoluteChangeX: 0,
  absoluteChangeY: 0,
  changeX: 0,
  changeY: 0
};

const propTypes = {
  onPanBegin: PropTypes.func,
  onPan: PropTypes.func,
  onPanEnd: PropTypes.func,
  resetPan: PropTypes.bool,
  panDecoratorStyle: PropTypes.any,
  disabled: PropTypes.bool
};

export default ({
  setGestureState = true
} = {}) => BaseComponent => {
  function Pannable(props) {
    const {
      disabled,
      onPanBegin,
      onPan,
      onPanEnd,
      resetPan,
      panDecoratorStyle,
      ...baseProps
    } = props;

    const [panState, setPanState] = useState(() => initialState);
    const propsRef = useRef(props);
    const lastX = useRef(0);
    const lastY = useRef(0);
    const absoluteChangeX = useRef(0);
    const absoluteChangeY = useRef(0);

    const handlePanResponderRelease = useCallback(() => {
      const { onPanEnd } = propsRef.current;
      lastX.current = absoluteChangeX.current;
      lastY.current = absoluteChangeY.current;
      onPanEnd && onPanEnd(); // eslint-disable-line no-unused-expressions
    }, []);

    const [panResponder] = useState(() =>
      PanResponder.create({
        onStartShouldSetPanResponder: ({ nativeEvent: { touches } }, { x0, y0 }) => {
          const shouldSet = touches.length === 1;

          if (shouldSet) {
            const { onPanBegin } = propsRef.current;
            onPanBegin && onPanBegin({ // eslint-disable-line no-unused-expressions
              originX: x0,
              originY: y0
            });
          }

          return shouldSet;
        },

        onMoveShouldSetPanResponder: ({ nativeEvent: { touches } }) => {
          return touches.length === 1;
        },

        onPanResponderMove: (evt, { dx, dy }) => {
          const { onPan } = propsRef.current;
          const panState = {
            absoluteChangeX: lastX.current + dx,
            absoluteChangeY: lastY.current + dy,
            changeX: dx,
            changeY: dy
          };

          onPan && onPan(panState); // eslint-disable-line no-unused-expressions

          absoluteChangeX.current = panState.absoluteChangeX;
          absoluteChangeY.current = panState.absoluteChangeY;
          if (setGestureState) setPanState(panState);
        },

        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: handlePanResponderRelease,
        onPanResponderRelease: handlePanResponderRelease
      })
    );

    useEffect(() => {
      if (!resetPan) return;
      lastX.current = 0;
      lastY.current = 0;
      absoluteChangeY.current = 0;
      absoluteChangeX.current = 0;
      if (setGestureState) setPanState(initialState);
    }, [resetPan]);

    useEffect(() => {
      propsRef.current = props;
    });

    const style = [
      {alignSelf: 'flex-start'},
      panDecoratorStyle,
    ];

    return (
      <Animated.View {...(!disabled  && panResponder.panHandlers)} style={style}>
        <BaseComponent {...baseProps} {...panState} />
      </Animated.View>
    );
  }
  Pannable.propTypes = propTypes;
  const MemoizedPannable = memo(Pannable);
  MemoizedPannable.propTypes = propTypes;
  return MemoizedPannable;
};
