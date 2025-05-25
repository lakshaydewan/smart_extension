import React from 'react'
import { Sparkles } from 'lucide-react';

const PopUp = () => {
  const styles = {
    iconWrapper: {
      backgroundColor: '#4f46e5',
      height: '3rem',
      width: '3rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1rem auto',
    },
    icon: {
      height: '1.5rem',
      width: '1.5rem',
      color: '#ffffff',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#201a17',
      marginBottom: '0.5rem',
    },
    description: {
      color: 'rgba(32, 26, 23, 0.8)',
    }
  };

  return (
    <div style={{
      width: '300px',
      borderRadius: '0.5rem',
    }}>
      <div style={styles.iconWrapper}>
        <Sparkles style={styles.icon} />
      </div>
      <h2 style={styles.title}>AI Assistant</h2>
      <p style={styles.description}>
        Your personal AI helper that can summarize, reformat, explain, analyze, predict, and suggest alternatives
        for any product or content you're working with.
      </p>
    </div>
  )
}

export default PopUp;
