import shortid from 'shortid';

const generateShortId = () => {
    return shortid.generate();
};

export default generateShortId;