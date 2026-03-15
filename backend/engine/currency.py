from typing import Dict

# Fixed conversion rates to INR
RATES_TO_INR: Dict[str, float] = {
    "IN": 1.0,        # India — INR base
    "US": 83.0,       # USA — 1 USD = 83 INR
    "GB": 106.0,      # UK — 1 GBP = 106 INR
    "DE": 90.0,       # Germany — 1 EUR = 90 INR
    "FR": 90.0,       # France — 1 EUR = 90 INR
    "IT": 90.0,       # Italy — 1 EUR = 90 INR
    "ES": 90.0,       # Spain — 1 EUR = 90 INR
    "NL": 90.0,       # Netherlands — 1 EUR = 90 INR
    "SE": 8.0,        # Sweden — 1 SEK = 8 INR
    "AE": 22.0,       # UAE — 1 AED = 22 INR
    "SG": 62.0,       # Singapore — 1 SGD = 62 INR
    "AU": 54.0,       # Australia — 1 AUD = 54 INR
    "CA": 61.0,       # Canada — 1 CAD = 61 INR
    "JP": 0.55,       # Japan — 1 JPY = 0.55 INR
    "CN": 11.5,       # China — 1 CNY = 11.5 INR
    "KR": 0.063,      # South Korea — 1 KRW = 0.063 INR
    "BR": 17.0,       # Brazil — 1 BRL = 17 INR
    "MX": 4.8,        # Mexico — 1 MXN = 4.8 INR
    "ZA": 4.5,        # South Africa — 1 ZAR = 4.5 INR
    "NG": 0.055,      # Nigeria — 1 NGN = 0.055 INR
}

CURRENCY_SYMBOLS: Dict[str, str] = {
    "IN": "₹", "US": "$", "GB": "£", "DE": "€", "FR": "€",
    "IT": "€", "ES": "€", "NL": "€", "SE": "kr", "AE": "د.إ",
    "SG": "S$", "AU": "A$", "CA": "C$", "JP": "¥", "CN": "¥",
    "KR": "₩", "BR": "R$", "MX": "$", "ZA": "R", "NG": "₦"
}

CURRENCY_NAMES: Dict[str, str] = {
    "IN": "INR", "US": "USD", "GB": "GBP", "DE": "EUR", "FR": "EUR",
    "IT": "EUR", "ES": "EUR", "NL": "EUR", "SE": "SEK", "AE": "AED",
    "SG": "SGD", "AU": "AUD", "CA": "CAD", "JP": "JPY", "CN": "CNY",
    "KR": "KRW", "BR": "BRL", "MX": "MXN", "ZA": "ZAR", "NG": "NGN"
}


def convert_to_inr(amount: float, country_code: str) -> float:
    rate = RATES_TO_INR.get(country_code.upper(), 1.0)
    return round(amount * rate, 2)


def get_currency_symbol(country_code: str) -> str:
    return CURRENCY_SYMBOLS.get(country_code.upper(), "")


def get_currency_name(country_code: str) -> str:
    return CURRENCY_NAMES.get(country_code.upper(), "INR")


def get_approval_tier(amount_inr: float) -> str:
    if amount_inr < 2500:
        return "low"        # Manager only
    elif amount_inr <= 10000:
        return "medium"     # Manager + Finance
    else:
        return "high"       # Manager + Finance + CEO