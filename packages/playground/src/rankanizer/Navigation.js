import React, {Component} from 'react';
import { NavLink as BaseNavLink } from 'react-router-dom';

const NavLink = React.forwardRef(
  ({ activeClassName, activeStyle, ...props }, ref) => {
    return (
      <BaseNavLink
        ref={ref}
        {...props}
        className={({ isActive }) =>
          [
            props.className,
            isActive ? activeClassName : null,
          ]
            .filter(Boolean)
            .join(" ")
        }
        style={({ isActive }) => ({
          ...props.style,
          ...(isActive ? activeStyle : null),
        })}
      />
    );
  }
);

class Navigation extends Component {

  render() {
    let content
    this.props.owner === this.props.account ? 
        content = <li><NavLink activeClassName='current' to='/create'>Create Poll</NavLink></li> :
        content = ""
    return (
    <nav>
      <ul>
        <li><NavLink activeClassName='current' to='/'>My Polls</NavLink></li>
        { content }
        <li><NavLink activeClassName='current' to='/vote'>Vote</NavLink></li>
        <li><NavLink activeClassName='current' to='/results'>Results</NavLink></li>
      </ul>
    </nav>
    )
  }
}

  export default Navigation;