"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDayOfYear, getDaysInYear, getDateFromDayOfYear } from '@/lib/date-utils';

interface OrbitalPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const ORBIT_RX = 600;
const ORBIT_RY = 400;
const SUN_RADIUS = 120;
const EARTH_RADIUS = 60;
const VIEWBOX_WIDTH = (ORBIT_RX + EARTH_RADIUS) * 2 + 40;
const VIEWBOX_HEIGHT = (ORBIT_RY + EARTH_RADIUS) * 2 + 40;

export function OrbitalPicker({ date, onDateChange, className }: OrbitalPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartInfo = useRef<{ angle: number; startDayOfYear: number; startYear: number; totalAngle: number } | null>(null);

  const year = date.getFullYear();
  const daysInYear = getDaysInYear(year);
  const dayOfYear = getDayOfYear(date);

  const angle = ((dayOfYear - 1) / daysInYear) * 360;

  const handleInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current || !dragStartInfo.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (currentAngle < 0) {
      currentAngle += 360;
    }

    let angleDiff = currentAngle - dragStartInfo.current.angle;
    
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    const newTotalAngle = dragStartInfo.current.totalAngle + angleDiff;

    const daysInStartYear = getDaysInYear(dragStartInfo.current.startYear);
    const dayOffset = (newTotalAngle / 360) * daysInStartYear;
    
    let newDayOfYear = dragStartInfo.current.startDayOfYear + dayOffset;
    
    let newYear = dragStartInfo.current.startYear;
    
    while (newDayOfYear > getDaysInYear(newYear)) {
      newDayOfYear -= getDaysInYear(newYear);
      newYear++;
    }
    while (newDayOfYear <= 0) {
      newYear--;
      newDayOfYear += getDaysInYear(newYear);
    }
    
    const newDate = getDateFromDayOfYear(Math.round(newDayOfYear), newYear);

    if (newDate.getTime() !== date.getTime()) {
      onDateChange(newDate);
    }
  };
  
  const startDragging = (clientX: number, clientY: number) => {
    setIsDragging(true);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let startAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (startAngle < 0) startAngle += 360;
    
    const currentDayOfYear = getDayOfYear(date);
    const currentAngleInOrbit = ((currentDayOfYear - 1) / getDaysInYear(date.getFullYear())) * 360;

    dragStartInfo.current = { 
      angle: startAngle, 
      startDayOfYear: currentDayOfYear,
      startYear: date.getFullYear(),
      totalAngle: 0,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    startDragging(e.clientX, e.clientY);
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const stopDragging = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartInfo.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    startDragging(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => stopDragging();
    const handleTouchEnd = () => stopDragging();
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    
    const handleMouseLeave = (e: MouseEvent) => {
        if (isDragging && !e.relatedTarget) {
            stopDragging();
        }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging]);
  
  const earthX = VIEWBOX_WIDTH / 2 + ORBIT_RX * Math.cos(angle * Math.PI / 180);
  const earthY = VIEWBOX_HEIGHT / 2 + ORBIT_RY * Math.sin(angle * Math.PI / 180);

  return (
    <div className={cn('flex justify-center items-center', isDragging ? 'cursor-grabbing' : 'cursor-grab', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-full max-w-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <defs>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          cx={VIEWBOX_WIDTH / 2}
          cy={VIEWBOX_HEIGHT / 2}
          rx={ORBIT_RX}
          ry={ORBIT_RY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          fill="none"
        />

        <circle
          cx={VIEWBOX_WIDTH / 2}
          cy={VIEWBOX_HEIGHT / 2}
          r={SUN_RADIUS}
          fill="hsl(var(--accent))"
          filter="url(#sun-glow)"
        />

        <g transform={`translate(${earthX}, ${earthY})`}>
          <defs>
            <radialGradient id="earthGradient" cx="40%" cy="40%" r="60%" fx="30%" fy="30%">
              <stop offset="0%" style={{stopColor: '#a8d5e5'}} />
              <stop offset="100%" style={{stopColor: '#6b93d6'}} />
            </radialGradient>
          </defs>
          <circle
            r={EARTH_RADIUS * 1.5}
            fill="transparent"
          />
          <circle
            r={EARTH_RADIUS}
            fill="url(#earthGradient)"
            stroke="#fff"
            strokeWidth="2"
            className="transition-transform duration-75 ease-linear group-hover:scale-110"
          />
          <g transform={`scale(${EARTH_RADIUS/50}) translate(-50, -50)`}>
            <path d="M50,1 C22.9,1,1,22.9,1,50s21.9,49,49,49s49-21.9,49-49S77.1,1,50,1z M79.8,52.2 c-1.4-0.3-2.9-0.4-4.3-0.4c-2.6,0-5.2,0.4-7.7,1.1c-2.4,0.7-4.8,1.8-7,3c-1.1,0.6-2.1,1.2-3.2,1.9c-1.3-1.8-2.4-3.6-3.5-5.5 c-1.1-2-2.1-4-3-6.1c-1-2.1-1.8-4.3-2.5-6.5c-0.7-2.2-1.3-4.5-1.7-6.8c1.6-0.5,3.2-1.2,4.8-1.9c2.9-1.4,5.6-3,8-5 c-1.1-0.9,2.2-1.9,3.1-2.9c0.3-0.4,0.6-0.8,0.9-1.2c-0.9,0.1-1.8,0.1-2.7,0.1c-4,0-7.9-0.6-11.7-1.9c-2.9-1-5.7-2.3-8.3-4 c-2-1.3-3.8-2.8-5.6-4.4c0.8,2,1.5,4,2,6.1c0.5,2.1,0.8,4.2,0.9,6.3c0.1,2.1-0.1,4.2-0.5,6.3c-0.4,2.1-1,4.1-1.9,6.1 c-0.6,1.4-1.3,2.7-2.1,4c-1.8,2.8-3.9,5.3-6.2,7.7c-0.7,0.7-1.4,1.4-2.1,2.1c-1.2,1.2-2.4,2.3-3.7,3.4c-0.1-1-0.2-2-0.2-3 c0-2.6,0.5-5.2,1.4-7.7c0.9-2.5,2.2-4.8,3.8-7c1-1.4,2-2.7,3.1-4c-1.8-0.2-3.6-0.3-5.4-0.2c-1.8,0.1-3.5,0.3-5.3,0.6 c-2.7,0.5-5.4,1.4-7.8,2.6c-2.5,1.2-4.8,2.8-6.9,4.6c1.4,0.3,2.9,0.4,4.3,0.4c2.6,0,5.2-0.4,7.7-1.1c2.4-0.7,4.8-1.8,7-3 c1.1-0.6,2.1-1.2,3.2-1.9c1.3,1.8,2.4,3.6,3.5,5.5c1.1,2,2.1,4,3,6.1c1,2.1,1.8,4.3,2.5,6.5c0.7,2.2,1.3,4.5,1.7,6.8 c-1.6,0.5-3.2,1.2-4.8,1.9c-2.9,1.4-5.6,3-8,5c-1.1,0.9-2.2,1.9-3.1,2.9c-0.3,0.4-0.6,0.8-0.9,1.2c0.9-0.1,1.8-0.1,2.7-0.1 c4,0,7.9,0.6,11.7,1.9c2.9,1,5.7,2.3,8.3,4c2,1.3,3.8,2.8,5.6,4.4c-0.8-2-1.5-4-2-6.1c-0.5-2.1-0.8-4.2-0.9-6.3 c-0.1-2.1,0.1-4.2,0.5-6.3c0.4-2.1,1-4.1,1.9-6.1c0.6-1.4,1.3-2.7,2.1-4c1.8-2.8,3.9-5.3,6.2-7.7c0.7-0.7,1.4-1.4,2.1-2.1 c1.2-1.2,2.4-2.3,3.7-3.4c0.1,1,0.2,2,0.2,3c0,2.6-0.5,5.2-1.4,7.7c-0.9,2.5-2.2,4.8-3.8,7c-1,1.4,2-2.7,3.1,4 c1.8,0.2,3.6,0.3,5.4,0.2c1.8-0.1,3.5-0.3,5.3-0.6c2.7-0.5,5.4-1.4,7.8-2.6C84.7,59.9,82.4,58.3,79.8,52.2z" fill="#6A9F5A"/>
          </g>
        </g>
      </svg>
    </div>
  );
}

    