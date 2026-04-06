import sqlite3
import os
import re

BASE_DIR = "/Users/bgm/my_Projects/SRS/Seva/backend"
DB_PATH = os.path.join(BASE_DIR, "seva.db")

image_map = {
  "20250528_123531.jpeg": "13U_TwNdhL0THngoUv68euRAHKEbeQ53n",
  "20250528_123046.jpeg": "1jF7Sa0RGtIjf4Xy5KpiN-XjjScTwtwYg",
  "20250528_122306.jpeg": "1lrH_mXihYdg4h4s9jkwr6_MXQADoI3QX",
  "20250528_122306 2.jpeg": "1E_Ygu-CRVUVC5T_ALCRLMDhmgt-fIbHy",
  "20250528_121958~2.jpg": "1WlSv8FXePLhx4bgr_a3DbgloxInAXeFI",
  "20250528_121845~2.jpg": "1kmsoqnMv6uGWNY0LKshy_yeslLOAhpWO",
  "20250528_121845.jpeg": "1gq48LetX3h1xXr_O7X6mTiSDZIvUbZYU",
  "20250528_121719.jpeg": "1Vbk7PHL2jlpUY0jBK-RlucByzxp49Hjd",
  "20250528_121623.jpeg": "1LJkA7OCzM57a7EET31DqM7f2-w_xINWo",
  "20250528_121520~2.jpg": "1i7W6r8cBRuaaFfIeDkYXNN1yBLdqmPqH",
  "20250528_121520.jpeg": "1jKNP4pp5-Fg7eZzCqZMGk8zoZQfrB5qk",
  "20250528_121148.jpeg": "1TPapB2ZbAFV_BT5kQ6AEaF46f3GQcPSe",
  "20250528_121057.jpeg": "1K5rxc9Oj61G8TPbB0VRBlvuPPzYEVrob",
  "20250528_120207.jpeg": "1qowDBaLx3H_z7mtC4XsIO8BIsMaRPAOD",
  "20250528_120023.jpeg": "14I_HDTfp2rkiM-jS0wPqPxu-MRQS-kOv",
  "20250528_115532.jpeg": "1ZtQwMfIv-QYNbJCNTueg9ewRYu72Burt",
  "20250528_114959.jpeg": "1KtU3hSdZYjB1E-inQlZAOKzMiHKejXRc",
  "20250528_114940.jpeg": "1miemoP8C3wFownWCU768dxRcK8lzCRgn",
  "20250528_114927.jpeg": "16IQ1OJbW786w4AGBlBUA4R8T4DoxbjF6",
  "20250528_114621.jpeg": "1toSD9qMJ-GCXF930PrbCoXJcAbwFYRoj",
  "20250528_114600.jpeg": "1Il6Mg1a7vepOBjThhTd4EUquz_Cm7c7x",
  "20250528_114505.jpeg": "1CuDjdOv3talgiq7MNnWNveWk95MIFfxt",
  "20250528_114106.jpeg": "13EbqEj14d93IbAVaxZoCOqaL01SUmlyX",
  "20250528_113818.jpeg": "14DIuWsUZqe8lSQW6nYP0dLaUF3tRhbhM",
  "20250528_113753.jpeg": "1SpM6Il13M3pdvtNxtfsKKLPNCIVueqNy",
  "20240707_135436.jpg": "13-1epJ3zw2XAjjbWr44W9KctJhgPmeiB",
  "20240707_135405.jpg": "1vyyVEOwwAdM4LiOrvc6r--2Wxfc4DLnY",
  "20240707_134733.jpg": "1Ml1U3mICyC_8CuOqR4Vsj07XMbyHON4W",
  "20240707_134650.jpg": "1fbcfc39mtgxALtcUeeQ7EWkyVTsjDEEO",
  "20240707_134523.jpg": "1vXARqong598O6mUVRxtw-DTcZf4hoLA8",
  "20240707_134201.jpg": "1oic-bnS3OGA46VR4_xFayCpnAgtZ-0kJ",
  "20240707_134123.jpg": "1kw46pAuHhdSt0dnsLWOr6yO-gP_CbP8L",
  "20240707_133714.jpg": "1DT7R0gG72l8k7KAgYQiIpNh2Bix-FMzs",
  "20240707_133629.jpg": "17s0WqML4QYrXW04lW2eQR0wN17S0iUUr",
  "20240707_133440.jpg": "1noIsamdnzUuCv9CbUIIjBOwmPlOkTD_V",
  "20240707_133349.jpg": "1kyMNVKDZADoj8MmBOYlem5DqllZXb8SL",
  "20240707_132951.jpg": "18RJ4JnRMNXNDz7kHbBzjtixh8_Yr-XbO",
  "20240707_132702.jpg": "1kM8MjuAMbFh36R-LxUFbnAODcMM7lUUj",
  "20240707_132648.jpg": "1a1zv-UNLNurkzWa9QGc0Mf1ecama5Pxv",
  "20240707_132547.jpg": "1ED4k5fjEJ9s80fPozmVOzpgb4hZwhmb4",
  "20240707_131219.jpg": "1uAw8DC4_bgp64LHiygAVXLYsUxDiYaTo",
  "20240707_131051.jpg": "1jkzUeYdXNwIsQ9HfO2KuSltcXvsDPIxo",
  "20240707_125935.jpg": "1SDXj-W0uL605ST5TDkC6nd5mwukHQ4yu",
  "20240707_125447.jpg": "1yIfH-vNi1s10B-isg0N65syW6k8fzg6D",
  "20240707_124810.jpg": "1QM71rYhlvKu729o7HbePZC2CQcqq8ejp",
  "20240707_124655.jpg": "17YmdWIL270ZZF1xkHc2lEoVQop9iNCYN",
  "20240707_124624.jpg": "12Lt7lOAGAsxBF6zXRyRGZkS8K-EZj7W_",
  "20240707_124604.jpg": "1qq213_nqak9z37i8CN7NxdDftckLvbQ9",
  "20240707_124546.jpg": "1GvSyj6LsY9VycUXTFMEw9hlQWc1ZV-kR",
  "20240707_124523.jpg": "1DYdnOg-yznD2eGD2NmBSjKg5iwZyO6Eo"
}

def get_base_name(filename):
    if not filename:
        return ""
    # Remove query params or formulas if any
    clean = filename.split("=")[0].strip()
    # Return everything before the last dot
    parts = clean.split(".")
    if len(parts) > 1:
        return ".".join(parts[:-1]).lower().strip()
    return clean.lower().strip()

def build_lookup():
    lookup = {}
    for k, v in image_map.items():
        base = get_base_name(k)
        lookup[base] = v
    return lookup

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT ItemId, ImageLink FROM InventoryItem WHERE ImageLink IS NOT NULL AND ImageLink != ''")
    items = cursor.fetchall()

    lookup = build_lookup()
    updated = 0

    for item_id, image_link in items:
        # If it's already an HTTP URL (that we didn't just add), we can skip unless it's a broken one or filename
        if image_link.startswith("https://lh3.googleusercontent.com/d/"):
            continue

        base_link = get_base_name(image_link)
        
        if base_link in lookup:
            file_id = lookup[base_link]
            new_link = f"https://lh3.googleusercontent.com/d/{file_id}"
            cursor.execute("UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?", (new_link, item_id))
            print(f"Updated ItemId {item_id}: {image_link} -> {new_link}")
            updated += 1
        elif "20240707_114425" in base_link:
            # Found in another file? The list from browser might be missing some if lazy-loading was an issue, but let's check.
            pass

    conn.commit()
    conn.close()
    print(f"Total updated: {updated}")

if __name__ == "__main__":
    main()
