import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function DynamicNavbar({
    active_id = '',
    direction = 'horizontal',
    width = 'full',
    rounded = '3xl',
    background = 'base-200',
    shadow = 'lg',
    navigation = {
        start: [
            {
                id: "item", text: 'Item', href: '/', icon: 'fas fa-house',
                tooltip: {
                    text: 'Item',
                    position: 'bottom'
                },
                dropdown: []
            },
            {
                id: "dropdown", text: 'Dropdown', href: '', icon: 'fas fa-caret-down',
                tooltip: {
                    text: 'Dropdown',
                    position: 'bottom'
                },
                dropdown: [
                    { id: "item_1", text: 'Item 1', href: '', icon: 'fas fa-circle' },
                    { id: "item_2", text: 'Item 2', href: '', icon: 'fas fa-triangle' },
                    { id: "item_3", text: 'Item 3', href: '', icon: 'fas fa-square' },
                ]
            }
        ],
        center: [
            {
                id: "logo", text: 'Logo', href: '/', img: '/images/logo/tetrago_black_contour.png', icon: '',
                tooltip: {
                    text: '',
                    position: ''
                },
                dropdown: []
            }
        ],
        end: []
    }
}) {
    // Render
    return (
        <>
            <div className={`navbar flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} justify-between items-center gap-2 z-800 w-${width} rounded-${rounded} bg-${background} shadow-${shadow} mb-1`}>
                <div className="navbar-start gap-2 flex-wrap">
                    {/* <!-- Navigation --> */}
                    {navigation.start.map((item, index) => (
                        (item.dropdown && item.dropdown.length > 0) ? (
                            <div key={index} className={`dropdown dropdown-bottom dropdown-start tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                <div tabIndex={0} role="button" className={`btn bg-base-200 rounded-3xl btn-ghost ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                    {item.icon && <FontAwesomeIcon icon={item.icon} />}
                                    {item.text && <span>{item.text}</span>}
                                </div>
                                <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                                    {item.dropdown.map((subItem, subIndex) => (
                                        <li key={subIndex}>
                                            <a href={subItem.href} className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active_id === subItem.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                                {subItem.icon && <FontAwesomeIcon icon={subItem.icon} />}
                                                {subItem.text && <span>{subItem.text}</span>}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div key={index} className={`tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                <a href={item.href} className={`btn btn-ghost rounded-3xl ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                    {item.icon && <FontAwesomeIcon icon={item.icon} />}
                                    {item.text && <span>{item.text}</span>}
                                </a>
                            </div>
                        )
                    ))}
                </div>
                {navigation.center.length > 0 && (
                    <div className="navbar-center hidden sm:flex">
                        {navigation.center.map((item, index) => (
                            (item.dropdown && item.dropdown.length > 0) ? (
                                <div key={index} className={`dropdown dropdown-bottom dropdown-start tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                    <div tabIndex={0} role="button" className={`btn bg-base-200 rounded-3xl btn-ghost ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                        {item.icon && <FontAwesomeIcon icon={item.icon} />}
                                        {item.text && <span>{item.text}</span>}
                                    </div>
                                    <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                                        {item.dropdown.map((subItem, subIndex) => (
                                            <li key={subIndex}>
                                                <a href={subItem.href} className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active_id === subItem.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                                    {subItem.icon && <FontAwesomeIcon icon={subItem.icon} />}
                                                    {subItem.text && <span>{subItem.text}</span>}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                item.img ? (
                                    <div key={index} className={`tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                        <a href={item.href} className={`btn btn-ghost rounded-3xl ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                            <img src={item.img} alt={item.text} className="w-8 h-8" />
                                            {item.text && <span className="hidden sm:flex">{item.text}</span>}
                                        </a>
                                    </div>
                                ) : (
                                    <div key={index} className={`tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                        <a href={item.href} className={`btn btn-ghost rounded-3xl ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                            {item.icon && <FontAwesomeIcon icon={item.icon} />}
                                            {item.text && <span>{item.text}</span>}
                                        </a>
                                    </div>
                                )
                            )
                        ))}
                    </div>
                )}
                {navigation.end.length > 0 && (
                    <div className="navbar-end">
                        {navigation.end.map((item, index) => (
                            (item.dropdown && item.dropdown.length > 0) ? (
                                <div key={index} className={`dropdown dropdown-bottom dropdown-end tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                    <div tabIndex={0} role="button" className={`btn bg-base-200 rounded-3xl btn-ghost ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                        {item.icon && <FontAwesomeIcon icon={item.icon} />}
                                        {item.text && <span>{item.text}</span>}
                                    </div>
                                    <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                                        {item.dropdown.map((subItem, subIndex) => (
                                            <li key={subIndex}>
                                                <a href={subItem.href} className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active_id === subItem.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                                    {subItem.icon && <FontAwesomeIcon icon={subItem.icon} />}
                                                    {subItem.text && <span>{subItem.text}</span>}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div key={index} className={`tooltip tooltip-${item.tooltip.position}`} data-tip={item.tooltip.text}>
                                    <a href={item.href} className={`btn btn-ghost rounded-3xl ${active_id === item.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                        {item.icon && <FontAwesomeIcon icon={item.icon} />}
                                        {item.text && <span>{item.text}</span>}
                                    </a>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}