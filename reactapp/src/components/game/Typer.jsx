
import { useState, useEffect, useRef } from 'react'
import Game from './Game';

const Letter = ({ letter, state, current }) => {


    let className;

    switch (state) {
        case 0:
            className = "letter";
            break;
        case 1:
            className = "letter correct";
            break;
        case 2:
            className = "letter incorrect";
            break;
    }

    if (current) {
        className += " current-letter"
    }

    return (

        <span className={className}>{letter}</span>
    )
}


const Word = ({ word, current, finished, letters }) => {

    if (current) {
        //console.log("I AM THE CURRENT WORD: ", word)
    }

    return (
        <div className={
            current ? "word word-current" : "word"
        }>

            {/* {
                letters.map((letter, index) => {
                    return <Letter 
                        letter={letter}
                        key={index}
                    />
                })
            } */}
            {
                letters.length > 0 ?
                    letters.map((letter, index) => {
                        return <Letter
                            letter={letter.letter}
                            state={letter.state}
                            key={index}
                        />
                    })
                    :
                    ""
            }
        </div>
    )
}


const Input = ({ word, currInput, handleInputChange, resetInput, getNextWord, finished, running }) => {

    const [currentWord, setCurrentWord] = useState("")

    const [wordComplete, setWordComplete] = useState(false)

    const [overFlow, setOverflow] = useState("")

    const inputRef = useRef(null)

    // ******************************
    // * Console.log Tests
    // console.log("INPUT CURRENT WORD STATE: ", currentWord)

    // console.log("INPUT CURRENT WORD, ", currentWord)
    // ******************************


    // * SIDE EFFECT: Changes to word
    useEffect(() => {
        // * Every time the paragraph changes in the main component
        // * The state of currentWord will have to reset.

        // console.log("INPUT EFFECT TRIGGERED")

        setCurrentWord(word)
        setOverflow("")


    }, [word])


    // * SIDE EFFECT: Changes to current input (currInput)
    useEffect(() => {

        // * On changes to the current input:
        // * - check/update how accurate the input is to the current word
        // * - 

        if (wordComplete && currInput.length > currentWord.length) {

            // * We need to check what the user has typed after 
            // * the word is complete

            const tempOverflow = currInput.substring(currentWord.length)

            // * If a space is typed immediatly after the word is complete, 
            // * we can move to the next word.

            // * If not an empty space, append it to the overflow.

            if (tempOverflow === " ") {
                // * Then move to the next word AND clear input



                getNextWord()
                resetInput()
            }
            else {

                // ? If the user types past the word incorrectly, 
                // ? the overflow will continue to grow. (Until they backspace and correct it.)
                setOverflow(tempOverflow)
            }


        }
        // * If the word is NOT complete OR
        // * it is complete but the input length is less than the word length
        // * THEN Set wordComplete to the appriopriate state.     
        else {

            if (currInput === currentWord &&
                currInput.length === currentWord.length) {
                setWordComplete(true)
            }
            else {

                // * If wordComplete is not set to false, then set it to false
                // * (To avoid unecessary re-rendering)
                if (wordComplete) {
                    setWordComplete(false)
                }
            }
        }

    }, [currInput])

    useEffect(() => {

        if (running) {
            inputRef.current.focus()
        }

    }, [running])

    return (
        <>
            <input
                type="text"
                value={currInput}
                onChange={handleInputChange}
                disabled={!running || finished}
                ref={inputRef}
                className="disabled:opacity-50 border-b-2 border-dashed border-black block mb-6 focus bg-gray-100 focus:outline-none"
            />

            {/* <button className="btn" onClick={getNextWord}>Next word</button> */}
        </>

    )
}




const Typer = ({ paragraphState, updateProgress, finished, running, updateCorrectChars, incrementCharsTyped, incrementIncorrectChars }) => {

    // ? The overall input is here so that this component can update
    // ? the overall progress and signal it to the Main Game component
    const [fullInput, setFullInput] = useState("")

    // ? Temp input will be used for the current word being typed
    // ? in the input. This is cleared when the user moves to the next word
    const [tempInput, setTempInput] = useState("")

    const [words, setWords] = useState([])
    const [wordIndex, setWordIndex] = useState(0)

    const [letters, setLetters] = useState([])
    const [letterIndex, setLetterIndex] = useState(0)

    const [overFlowMode, setOverFlowMode] = useState(false)


    // *******************
    // * UTILITY FUNCTIONS
    function resetInput(resetFullInput = false) {
        /**
         * Parameters:
         * - resetFullInput : boolean 
         *      - If set to true, the full input is also reset
         */
        setTempInput("")

        if (resetFullInput) {
            setFullInput("")
        }
    }


    function getNextWord() {
        /**
         * * Move to the next word in the paragraph. The player's progress
         * * is also updated for every word correct.
         */

        // ? Getnextword using the original words array
        if (wordIndex < words.length) {

            setWordIndex(prevIndex => prevIndex + 1)

            const inputWordCount = splitString(fullInput, true).length

            const wordCount = words.length

            const currProgress = (inputWordCount / wordCount)

            updateProgress(currProgress)

        }

    }

    function getCorrectChars() {
        /**
         * * Counts the correct characters typed, and stops at
         * * the first incorrect character found.
         */

        let correctCount = 0

        for (let i = 0; i < fullInput.length; i++) {

            if (fullInput[i] === paragraphState[i]) {
                correctCount++
            }
            else {
                break
            }
        }

        return correctCount
    }

    function splitString(string, splitOnSpace = false) {
        /**
         * * Split a string on spaces
         */


        // ? An empty string will be added to the end of the split array.
        // ? It needs to be filtered out.


        const split = string.split(splitOnSpace ? " " : "")
            .filter(string => string.length > 0)

        return split
    }

    const createLetters = (paragraph) => {

        const tempLetters = splitString(paragraph)

        const result = []

        for (let letter of tempLetters) {
            result.push({
                letter: letter,
                // ? 0 == letter hasn't been typed yet, 1 == correct, 2 == incorrect
                state: 0
            })
        }

        return result
    }

    const handleInputChange = (event) => {
        /**
         * * Updates both the temporary input (tempInput) and 
         * * the full input (fullInput) states.
         */



        const inputValue = event.target.value

        const recentChar = inputValue[inputValue.length - 1]

        setTempInput(event.target.value)


        // Increment the amount of times the user pressed a key
        incrementCharsTyped()

        // * NEW CHARACTER = APPEND
        // * If current value is greater than current state length --> Append
        if (inputValue.length > tempInput.length) {


            setFullInput(prevInput => prevInput += inputValue[inputValue.length - 1])



            // ? Only increment letterIndex if it is less than the amount of characters
            if (letterIndex < letters.length) {
                setLetterIndex(prevIndex => prevIndex + 1)
                setLetters(prevLetters => {

                    const updatedLetters = [...prevLetters]


                    const newLetterObj = { ...prevLetters[letterIndex], state: 1 }

                    // ? Conditions to determine whether to label the recently typed letter as 
                    // ? correct (1) or incorrect (2)
                    if (prevLetters[letterIndex].letter !== recentChar) {

                        incrementIncorrectChars()
                        newLetterObj.state = 2
                    }
                    else if (letterIndex > 0) {

                        // ? Any characters typed after an incorrect character are 
                        //      automatically set to incorrect, even if they match.
                        if (prevLetters[letterIndex - 1].state === 2) {

                            incrementIncorrectChars()
                            newLetterObj.state = 2
                        }

                    }

                    updatedLetters[letterIndex] = newLetterObj

                    return updatedLetters

                })

            }

        }
        // * BACKSPACE = UN-APPEND
        // * Otherwise (If the user pressed backspace) remove one from the input
        else {


            setFullInput(prevInput => prevInput.slice(0, prevInput.length - 1))

            // * The change to full input won't be reflected until after the function excecutes

            const inputOffset = fullInput.length - paragraphState.length
            let overflowMode = false

            if (inputOffset >= 1) {
                overflowMode = true
            }

            if (!overflowMode) {
                setLetterIndex(prevIndex => prevIndex - 1)

                // ? Simply set the recently backspaced letter back to the default value -> (0)
                setLetters(prevLetters => {

                    const updatedLetters = [...prevLetters]

                    const newLetterObj = { ...prevLetters[letterIndex - 1], state: 0 }

                    updatedLetters[letterIndex - 1] = newLetterObj

                    return updatedLetters

                })
            }

        }

    }

    const resetParagraph = () => {
        // ? Mostly everything in the component should be reset when
        // ? a new paragraph is received.

        console.log("PARAGRAPH useEffect")

        const splitted = splitString(paragraphState, true)
        const splitLetters = createLetters(paragraphState)

        // ? Set the original words array
        setWords(splitted)
        setLetters(splitLetters)

        // * Reset everything else...
        setFullInput("")
        setTempInput("")
        setWordIndex(0)
    }

    // *******************

    // *******************
    // * USE EFFECTS

    // * SIDE EFFECT --> Resets the words everytime a new paragraph is sent.
    useEffect(() => {
        

        console.log("PARAGRAPH useEffect")

        const splitted = splitString(paragraphState, true)
        const splitLetters = createLetters(paragraphState)

        // ? Set the original words array
        setWords(splitted)
        setLetters(splitLetters)

        // * Reset everything else...
        setFullInput("")
        setTempInput("")
        setWordIndex(0)
        setLetterIndex(0)

    }, [paragraphState])

    // * SIDE EFFECT --> Check progress of fullInput
    useEffect(() => {

        // ? Progress is only changed if the paragraph is ready.
        // ? If the paragraph is an empty string (falsy), it is not ready.
        if (paragraphState && fullInput === paragraphState) {
            updateProgress(1)
            resetInput()
        }

        // * Update correct characters (correctChars) each time the input changes

        updateCorrectChars(getCorrectChars())


    }, [fullInput])

    return (
        <>

            <div className="words">

                {
                    letters.length > 0 ?
                        letters.map((letter, index) =>
                            <Letter
                                key={index}
                                letter={letter.letter}
                                state={letter.state}
                                current={letterIndex === index}
                            />
                        ) :
                        ""
                }


            </div>

            <Input
                word={words[wordIndex]}
                // word={wordsArr.length > 0 ? wordsArr[wordIndex].word : ""}

                handleInputChange={handleInputChange}
                getNextWord={getNextWord}
                resetInput={resetInput}
                currInput={tempInput} // TODO: Link the currInput to a temp input for the current word typed
                finished={finished}
                running={running}
            />

        </>
    )

}

export default Typer