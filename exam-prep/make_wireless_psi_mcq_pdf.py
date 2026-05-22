from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    ListFlowable,
    ListItem,
    PageBreak,
)


OUT = "exam-prep/wireless-psi-technical-mcq-practice.pdf"


def p(text, style):
    return Paragraph(text, style)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleBlue",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0b3d62"),
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="HeadingBlue",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#145a7a"),
        spaceBefore=12,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Question",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        spaceBefore=7,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="NormalSmall",
        parent=styles["BodyText"],
        fontSize=9.5,
        leading=12,
    )
)
styles.add(
    ParagraphStyle(
        name="Note",
        parent=styles["BodyText"],
        fontSize=9.5,
        leading=12,
        backColor=colors.HexColor("#f1f6f8"),
        borderColor=colors.HexColor("#2e86ab"),
        borderWidth=0.8,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8,
    )
)


syllabus = [
    "Electronics Components, Devices and Circuits",
    "Digital Electronics and VLSI",
    "Electronics Networks and Instruments and Measurements",
    "Communication Engineering",
    "Communication Applications",
    "Microprocessors and Microcontrollers",
    "Computer Networks",
    "Essentials of Network Security",
    "Web Technology",
    "Android Application Development",
    "Current Trends: 4G LTE, POLNET, disaster communication, real-time surveillance, recent advancements",
]


questions = [
    ("Intrinsic semiconductor means:", ["A pure semiconductor without intentional impurity", "A conductor with high impurity", "An insulator with zero conductivity", "A semiconductor only with pentavalent impurity"], "A"),
    ("Silicon and germanium are examples of:", ["Conductors", "Semiconductors", "Insulators only", "Magnetic materials"], "B"),
    ("In an N-type semiconductor, majority carriers are:", ["Holes", "Electrons", "Neutrons", "Positive ions only"], "B"),
    ("N-type semiconductor is formed by adding:", ["Trivalent impurity", "Pentavalent impurity", "Divalent impurity", "Monovalent impurity"], "B"),
    ("P-type semiconductor is formed by adding:", ["Trivalent impurity", "Pentavalent impurity", "No impurity", "Only silicon dioxide"], "A"),
    ("Majority carriers in P-type semiconductor are:", ["Electrons", "Holes", "Photons", "Negative ions"], "B"),
    ("The barrier potential of a silicon diode is approximately:", ["0.1 V", "0.3 V", "0.7 V", "1.5 V"], "C"),
    ("The barrier potential of a germanium diode is approximately:", ["0.3 V", "0.7 V", "1.2 V", "5 V"], "A"),
    ("A PN junction diode conducts current mainly in:", ["Reverse bias", "Forward bias", "Zero bias only", "Open circuit condition only"], "B"),
    ("In reverse bias, diode current is ideally:", ["Very high", "Zero", "Equal to forward current", "Only AC current"], "B"),
    ("Depletion region in a PN junction contains:", ["Free electrons and holes in large quantity", "Immobile ions", "Only photons", "Only protons moving freely"], "B"),
    ("Reverse saturation current in a diode is mainly due to:", ["Majority carriers", "Minority carriers", "External resistor", "Battery polarity only"], "B"),
    ("Zener diode is normally operated in:", ["Forward bias only", "Reverse breakdown region", "Open circuit region", "Saturation region of BJT"], "B"),
    ("Main use of Zener diode is:", ["Voltage regulation", "Current amplification", "Radio transmission", "Magnetic storage"], "A"),
    ("LED emits light when it is:", ["Forward biased", "Reverse biased beyond breakdown", "Connected as an open circuit", "Used as a capacitor"], "A"),
    ("A photodiode is generally operated in:", ["Forward bias", "Reverse bias", "Saturation of transistor", "Short circuit only"], "B"),
    ("Rectifier is used to convert:", ["DC to AC", "AC to DC", "Low frequency to high frequency only", "Analog signal to digital signal only"], "B"),
    ("Ripple factor is related to:", ["Unwanted AC component in rectifier output", "Magnetic flux density", "Only antenna gain", "Frequency modulation index"], "A"),
    ("A filter circuit in a power supply is used to:", ["Increase ripple", "Reduce ripple", "Convert DC to RF", "Destroy the diode"], "B"),
    ("The peak inverse voltage is important for selecting:", ["Diode in rectifier circuit", "Only resistor color code", "Only capacitor dielectric color", "Logic gate family"], "A"),
    ("BJT stands for:", ["Base Junction Transmitter", "Bipolar Junction Transistor", "Binary Junction Transformer", "Balanced Junction Terminal"], "B"),
    ("A BJT has how many terminals?", ["2", "3", "4", "5"], "B"),
    ("The three terminals of a BJT are:", ["Anode, cathode, gate", "Emitter, base, collector", "Source, gate, drain", "Input, output, ground only"], "B"),
    ("In normal active mode of NPN transistor:", ["Emitter-base junction is forward biased and collector-base junction is reverse biased", "Both junctions are reverse biased", "Both junctions are forward biased", "Emitter-base junction is reverse biased and collector-base junction is forward biased"], "A"),
    ("Common emitter amplifier provides:", ["Voltage gain and phase reversal", "No voltage gain", "Only impedance matching with gain less than 1 always", "Only rectification"], "A"),
    ("Current gain in common emitter configuration is denoted by:", ["Alpha", "Beta", "Gamma ray", "Omega"], "B"),
    ("Transistor biasing is required to:", ["Set proper operating point", "Remove all DC supply", "Make transistor an insulator", "Convert it into a diode only"], "A"),
    ("Thermal runaway in transistor is related to:", ["Decrease in temperature only", "Increase in collector current due to temperature rise", "Only antenna radiation", "Only digital clock pulse"], "B"),
    ("A transistor can be used as:", ["Amplifier and switch", "Only fuse", "Only transformer", "Only mechanical relay"], "A"),
    ("In cutoff region, a transistor acts approximately as:", ["Closed switch", "Open switch", "Perfect battery", "Capacitor only"], "B"),
    ("Binary number system has base:", ["2", "8", "10", "16"], "A"),
    ("Decimal number 10 is equal to which binary number?", ["1010", "1001", "1110", "0101"], "A"),
    ("The output of AND gate is 1 when:", ["All inputs are 1", "Any one input is 0", "All inputs are 0", "Inputs are floating"], "A"),
    ("The output of OR gate is 0 when:", ["All inputs are 0", "Any one input is 1", "All inputs are 1", "One input is high"], "A"),
    ("NOT gate is also called:", ["Buffer", "Inverter", "Adder", "Counter"], "B"),
    ("Universal gates are:", ["AND and OR", "NAND and NOR", "XOR and XNOR only", "NOT and buffer"], "B"),
    ("Flip-flop is used to store:", ["One bit of information", "One byte always", "Only analog voltage continuously", "Only RF signal"], "A"),
    ("A counter is made using:", ["Flip-flops", "Only resistors", "Only transformers", "Only antennas"], "A"),
    ("ADC converts:", ["Analog signal to digital signal", "Digital signal to analog signal", "AC to DC only", "DC to AC only"], "A"),
    ("DAC converts:", ["Analog signal to digital signal", "Digital signal to analog signal", "High voltage to zero voltage only", "Optical signal to RF only"], "B"),
]


story = [
    p("GPRB Wireless PSI Technical MCQ Practice", styles["TitleBlue"]),
    p("Initial PDF set for revision. Based on official GPRB/OJAS Advt. GPRB/202526/2 exam pattern.", styles["NormalSmall"]),
    p("Exam Pattern Snapshot", styles["HeadingBlue"]),
]

pattern = [
    ["Part", "Subject", "Questions", "Marks"],
    ["Part A", "Reasoning, Quantitative Aptitude, Constitution, Current Affairs and GK", "80", "80"],
    ["Part B", "Technical Subject", "120", "120"],
    ["Total", "Objective MCQ exam", "200", "200"],
]
table = Table(pattern, colWidths=[28 * mm, 105 * mm, 22 * mm, 20 * mm])
table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f1f5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0b3d62")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#b0bec5")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("LEADING", (0, 0), (-1, -1), 10),
        ]
    )
)
story.extend([table, Spacer(1, 6)])
story.append(
    p(
        "Time: 3 hours. Each question: 1 mark. Wrong attempted answer: -0.25. Blank question without selecting any option: -0.25. Use option E / Not Attempted when unsure.",
        styles["Note"],
    )
)

story.append(p("Technical Syllabus List", styles["HeadingBlue"]))
story.append(
    ListFlowable(
        [ListItem(p(item, styles["NormalSmall"])) for item in syllabus],
        bulletType="1",
        leftIndent=14,
    )
)

story.append(PageBreak())
story.append(p("Practice MCQs", styles["HeadingBlue"]))
for idx, (question, options, _) in enumerate(questions, 1):
    story.append(p(f"{idx}. {question}", styles["Question"]))
    option_text = "<br/>".join(f"{chr(65 + i)}. {opt}" for i, opt in enumerate(options))
    story.append(p(option_text, styles["NormalSmall"]))

story.append(PageBreak())
story.append(p("Answer Key", styles["HeadingBlue"]))
answer_rows = []
for i in range(0, len(questions), 5):
    answer_rows.append(", ".join(f"{j + 1}-{questions[j][2]}" for j in range(i, min(i + 5, len(questions)))))
for row in answer_rows:
    story.append(p(row, styles["NormalSmall"]))

story.append(p("How To Use This PDF", styles["HeadingBlue"]))
story.append(
    ListFlowable(
        [
            ListItem(p("First attempt questions without seeing answer key.", styles["NormalSmall"])),
            ListItem(p("Mark weak areas: diode, transistor, digital basics, etc.", styles["NormalSmall"])),
            ListItem(p("Revise formulas and definitions for wrong answers.", styles["NormalSmall"])),
            ListItem(p("Re-attempt the same set after 2 days.", styles["NormalSmall"])),
        ],
        bulletType="1",
        leftIndent=14,
    )
)

doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    rightMargin=14 * mm,
    leftMargin=14 * mm,
    topMargin=16 * mm,
    bottomMargin=16 * mm,
)
doc.build(story)
print(OUT)
