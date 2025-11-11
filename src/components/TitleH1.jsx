export default function TitleH1({ text, classes = 'bg-base-200', style = {width: '100%', fontSize: '1.6rem',fontWeight: 'bold',padding: '0.5rem 1rem',borderRadius: '0.5rem'} }) {
    return (
        <div className={`flex gap-2 ${classes}`} style={style}>
            <h1>{text}</h1>
        </div>
    );
}

  