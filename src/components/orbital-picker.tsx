"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDayOfYear, getDaysInYear } from '@/lib/date-utils';

interface OrbitalPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const ORBIT_RX = 240;
const ORBIT_RY = 150;
const SUN_RADIUS = 40;
const EARTH_RADIUS = 20;
const VIEWBOX_WIDTH = (ORBIT_RX + EARTH_RADIUS) * 2 + 40;
const VIEWBOX_HEIGHT = (ORBIT_RY + EARTH_RADIUS) * 2 + 40;

export function OrbitalPicker({ date, onDateChange, className }: OrbitalPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartInfo = useRef<{ angle: number; time: number } | null>(null);
  const accumulatedAngle = useRef(0);

  const year = date.getFullYear();
  const daysInYear = getDaysInYear(year);
  const dayOfYear = getDayOfYear(date);

  const angle = ((dayOfYear - 1) / daysInYear) * 360 + accumulatedAngle.current;

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

    if (Math.abs(angleDiff) > 180) {
      angleDiff += angleDiff > 0 ? -360 : 360;
    }

    const newTime = dragStartInfo.current.time + (angleDiff / 360) * getDaysInYear(new Date(dragStartInfo.current.time).getFullYear()) * 24 * 60 * 60 * 1000;
    const newDate = new Date(newTime);
    
    dragStartInfo.current = { angle: currentAngle, time: newTime };

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
    
    dragStartInfo.current = { angle: startAngle, time: date.getTime() };
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
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchend', stopDragging);
    window.addEventListener('touchcancel', stopDragging);
    
    const handleMouseLeave = (e: MouseEvent) => {
        if (isDragging && e.relatedTarget === null) {
            stopDragging();
        }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchend', stopDragging);
      window.removeEventListener('touchcancel', stopDragging);
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
        className="w-full max-w-md"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <defs>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
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
          strokeWidth="1"
          strokeDasharray="4 4"
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
           <circle
            r={EARTH_RADIUS * 1.5}
            fill="transparent"
          />
          <circle
            r={EARTH_RADIUS}
            fill="#6b93d6"
            stroke="#fff"
            strokeWidth="1.5"
            className="transition-transform duration-75 ease-linear group-hover:scale-110"
          />
        </g>
      </svg>
    </div>
  );
}
